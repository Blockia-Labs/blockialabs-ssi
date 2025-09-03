import { base58 } from '@scure/base';
import { ICredentialFormatHandler, ISchemaVerifier } from './interfaces/index.js';
import { IDIDResolver, IVerificationMethod } from '@blockialabs/ssi-did';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { verifySignature } from '@blockialabs/ssi-utils';
import {
  CredentialFormatType,
  ICompleteOptions,
  ICredential,
  IIssueOptions,
  IPrepareOptions,
  IPreparedCredential,
  IProof,
  ProofPurpose,
  ProofType,
  SignatureType,
  VerificationResult,
} from './types/index.js';

/**
 * Core processor for verifiable credentials
 * Orchestrates preparation, signing and verification operations
 */
export class CredentialProcessor {
  private didResolver: IDIDResolver;
  private schemaValidator: ISchemaVerifier;
  private signatureProviders: Map<SignatureType, ISignatureProvider> = new Map();
  private formatHandlers: Map<CredentialFormatType, ICredentialFormatHandler> = new Map();

  /**
   * Create a new CredentialProcessor
   */
  constructor(options: {
    didResolver: IDIDResolver;
    schemaValidator: ISchemaVerifier;
    formatHandlers: Partial<Record<CredentialFormatType, ICredentialFormatHandler>>;
    signatureProviders?: Record<SignatureType, ISignatureProvider>;
  }) {
    this.didResolver = options.didResolver;
    this.schemaValidator = options.schemaValidator;

    Object.entries(options.formatHandlers).forEach(([format, handler]) => {
      this.registerFormatHandler(format as CredentialFormatType, handler);
    });

    if (options.signatureProviders) {
      Object.entries(options.signatureProviders).forEach(([type, provider]) => {
        this.registerSignatureProvider(type as SignatureType, provider);
      });
    }
  }

  /**
   * Register a signature provider
   */
  registerSignatureProvider(type: SignatureType, provider: ISignatureProvider): void {
    this.signatureProviders.set(type, provider);
  }

  /**
   * Get all registered signature providers
   * @returns A map of signature providers
   */
  getSignatureProviders() {
    return this.signatureProviders;
  }

  /**
   * Register a credential format handler
   */
  registerFormatHandler(format: CredentialFormatType, handler: ICredentialFormatHandler): void {
    this.formatHandlers.set(format, handler);
  }

  /**
   * Prepare a credential for signing
   *
   * @param credential - The credential to prepare
   * @param options - Options for preparation
   * @returns A prepared credential ready for signing
   */
  async prepareIssuance(
    credential: ICredential,
    options: IPrepareOptions,
  ): Promise<IPreparedCredential> {
    const format = options.credentialFormat || CredentialFormatType.JSON_LD;
    const handler = this.formatHandlers.get(format);
    if (!handler) {
      throw new Error(`No handler registered for format: ${format}`);
    }

    // 1. Validate credential against schema if available
    let validatedCredential = credential;
    const schemaId = validatedCredential.credentialSchema?.id;

    if (this.schemaValidator && credential.credentialSchema) {
      validatedCredential = await this.schemaValidator.validate(credential, schemaId);
    }

    // 2. Make a copy of the credential without any existing proof
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { proof, ...credWithoutProof } = validatedCredential as ICredential;

    // 3. Create canonical form for signing
    const canonicalForm = await handler.canonicalize(credWithoutProof, options.contextHashes);

    if (!canonicalForm) {
      throw new Error('Failed to canonicalize credential');
    }

    // 5. Create and return the prepared credential
    return {
      credential: credWithoutProof as ICredential,
      canonicalForm,
      credentialFormat: format,
      options,
    };
  }

  /**
   * Complete the issuance of a credential
   *
   * @param preparedCredential - The prepared credential
   * @param options - Options for completion
   * @returns The signed credential
   */
  async completeIssuance(
    preparedCredential: IPreparedCredential,
    options: ICompleteOptions,
  ): Promise<ICredential & { proof: IProof }> {
    const { verificationMethod, signature } = options;

    // 1. Resolve the verification method
    const verificationMethodInfo = await this.resolveVerificationMethod(verificationMethod);

    if (!verificationMethodInfo) {
      throw new Error(`Verification method ${verificationMethod} not found`);
    }

    const extendedVerificationMethod = this.decodeAndAddKey(verificationMethodInfo);
    const proofType = options.proofType || ProofType.EcdsaSecp256k1Signature2019;

    // 2. If verification is requested, verify the signature
    // Get signature type from options or derive it from proof type
    // Todo: should be signatureType not proofType
    const signatureType = options.signatureType || this.getSignatureTypeFromProofType(proofType);
    const signatureProvider = this.signatureProviders.get(signatureType);

    if (!signatureProvider) {
      throw new Error(`No signature provider registered for type: ${signatureType}`);
    }

    await verifySignature(
      signatureProvider,
      signature,
      preparedCredential.canonicalForm,
      extendedVerificationMethod.publicKeyHex,
    );

    // 3. Create the final proof
    const proof: IProof = {
      type: proofType,
      created: new Date().toISOString(),
      verificationMethod: verificationMethod,
      proofPurpose: ProofPurpose.AssertionMethod,
      proofValue: signature,
      ...(options.challenge && { challenge: options.challenge }),
      ...(options.domain && { domain: options.domain }),
    };

    // 4. Return the signed credential
    return {
      ...preparedCredential.credential,
      proof,
    };
  }

  /**
   * Issue a credential in one step
   *
   * @param credential - The credential to issue
   * @param options - Options for issuing
   * @returns The issued credential
   */
  async issue(credential: ICredential, options: IIssueOptions): Promise<ICredential> {
    // 1. Get the signature provider
    const signatureProvider = this.signatureProviders.get(options.signatureType);
    if (!signatureProvider) {
      throw new Error(`No signature provider registered for type: ${options.signatureType}`);
    }

    // 2. Prepare the credential
    const prepared = await this.prepareIssuance(credential, options);

    const issuerId =
      typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id;

    // 3. Sign the canonical form
    const signature = await signatureProvider.sign(prepared.canonicalForm, issuerId);

    // 4. Complete issuance
    return this.completeIssuance(prepared, {
      ...options,
      signature,
    });
  }

  /**
   * Verify a credential's proof
   *
   * @param credential - The credential to verify with a proof
   * @param options - Options for verification; same as for prepareIssuance
   * @returns Verification result
   */
  async verify(credential: ICredential, options: IPrepareOptions): Promise<VerificationResult> {
    try {
      // 1. Check if credential has proof
      if (!credential.proof) {
        return {
          valid: false,
          reason: 'Credential has no proof',
        };
      }

      // 2. Handle single or multiple proofs
      const proofs = Array.isArray(credential.proof) ? credential.proof : [credential.proof];

      // 3. Use prepareIssuance to handle canonicalization
      // Prepare the credential to get its canonical form
      const prepared = await this.prepareIssuance(credential, options);
      const canonicalForm = prepared.canonicalForm;

      // 4. Verify each proof
      for (const proof of proofs) {
        try {
          // Get verification method
          const verificationMethodInfo = await this.resolveVerificationMethod(
            proof.verificationMethod,
          );

          // Verify challenge if provided in options
          if (proof.challenge !== options.challenge) {
            return {
              valid: false,
              reason: `Challenge mismatch: expected '${options.challenge}', got '${
                proof.challenge || 'none'
              }'`,
            };
          }

          // Verify domain if provided in options
          if (proof.domain !== options.domain) {
            return {
              valid: false,
              reason: `Domain mismatch: expected '${options.domain}', got '${
                proof.domain || 'none'
              }'`,
            };
          }

          // Todo: should be signatureType not proofType
          const signatureType = this.getSignatureTypeFromProofType(proof.type.toString());
          const signatureProvider = this.signatureProviders.get(signatureType);
          if (!signatureProvider) {
            throw new Error(`No signature provider registered for type: ${signatureType}`);
          }

          // Decode and extend verification method to get publicKeyHex
          const extendedVerificationMethod = this.decodeAndAddKey(verificationMethodInfo);

          await verifySignature(
            signatureProvider,
            proof.proofValue,
            canonicalForm,
            extendedVerificationMethod.publicKeyHex,
          );
        } catch (error) {
          return {
            valid: false,
            reason: error instanceof Error ? error.message : String(error),
          };
        }
      }

      // All proofs valid
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Resolves a verification method from a DID Document
   *
   * @param verificationMethodId - The verification method ID
   * @returns The verification method object
   * @throws Error if verification method can't be resolved
   */
  private async resolveVerificationMethod(
    verificationMethodId: string,
  ): Promise<IVerificationMethod> {
    // Extract DID from verification method
    const [did] = verificationMethodId.split('#');
    if (!did) {
      throw new Error(`Invalid verification method ID format: ${verificationMethodId}`);
    }

    // Resolve DID document and find verification method
    try {
      const result = await this.didResolver.resolve(did);
      const verificationMethod = result.didDocument?.verificationMethod?.find(
        (vm: IVerificationMethod) => vm.id === verificationMethodId,
      );

      if (!verificationMethod) {
        throw new Error(`Verification method ${verificationMethodId} not found in DID document`);
      }

      return verificationMethod;
    } catch (error) {
      throw new Error(
        `Failed to resolve verification method: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Get signature type from proof type
   */
  private getSignatureTypeFromProofType(proofType: string | ProofType): SignatureType {
    const proofTypeStr = proofType.toString();

    if (proofTypeStr.includes('Secp256k1')) {
      return 'Secp256k1';
    } else if (proofTypeStr.includes('JsonWebSignature')) {
      return 'JsonWebKey';
    }
    throw new Error(`Unsupported proof type: ${proofTypeStr}`);
  }

  private decodeAndAddKey(
    verificationMethod: IVerificationMethod,
  ): IVerificationMethod & { publicKeyHex: string } {
    const publicKeyMultibase = verificationMethod.publicKeyMultibase;

    const base58Key = publicKeyMultibase?.slice(1); // strip 'z' prefix
    if (!base58Key) {
      throw new Error('publicKeyMultibase is undefined or invalid');
    }
    const keyBytes = base58.decode(base58Key);
    const publicKeyHex = Buffer.from(keyBytes).toString('hex');

    return {
      ...verificationMethod,
      publicKeyHex,
    };
  }
}
