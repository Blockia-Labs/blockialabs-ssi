import { EnhancedVerificationResult } from './ResponseValidator.js';
import { IDIDResolver, IVerificationMethod } from '@blockialabs/ssi-did';
import { IProof, ProofPurpose, SignatureType } from '@blockialabs/ssi-credentials';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { IVerifiablePresentation } from '../types/ClaimTypes.js';
import { VerificationOptions } from '../types/PresentationResponse.js';
import { verifySignature } from '@blockialabs/ssi-utils';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { base58 } from '@scure/base';
/**
 * Specialized validator for verifying Verifiable Presentation proofs
 */
export class VpProofValidator {
  /**
   * Create a new VP proof validator
   * @param didResolver The DID resolver for resolving verification methods
   * @param signatureProviders A map of signature providers for different signature types
   */
  constructor(
    private readonly didResolver: IDIDResolver,
    private readonly signatureProviders: Map<SignatureType, ISignatureProvider>,
  ) {}

  /**
   * Verify a VP proof
   * @param vpToken The VP token to verify
   * @param options Verification options
   * @returns Verification result with all errors collected
   */
  async verifyProof(
    vpToken: IVerifiablePresentation,
    options: VerificationOptions,
  ): Promise<EnhancedVerificationResult> {
    const errors: string[] = [];

    try {
      // 1. Basic structure validation
      if (!vpToken) {
        return {
          valid: false,
          reason: 'Missing VP token',
          errors: ['Missing VP token'],
        };
      }

      if (!vpToken.proof) {
        return {
          valid: false,
          reason: 'VP token has no proof',
          errors: ['VP token has no proof'],
        };
      }

      const proofs = Array.isArray(vpToken.proof) ? vpToken.proof : [vpToken.proof];

      // 2. Check for authentication purpose proofs
      const authenticationProofs = proofs.filter(
        (p: IProof) => p.proofPurpose === ProofPurpose.Authentication,
      );

      if (authenticationProofs.length === 0) {
        return {
          valid: false,
          reason: 'VP token has no proof with authentication purpose',
          errors: ['VP token has no proof with authentication purpose'],
        };
      }

      // 3. For each authentication proof, verify it and collect all errors
      for (const proof of authenticationProofs) {
        const proofVerification = await this.verifyVpProof(vpToken, proof, options);
        if (!proofVerification.valid) {
          // Add detailed errors if available
          if (proofVerification.errors && proofVerification.errors.length > 0) {
            errors.push(...proofVerification.errors);
          }
        }
      }

      // Return results with all collected errors
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0], // First error as main reason
          errors: errors,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `VP proof verification error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        errors: [
          `VP proof verification error: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  /**
   * Verify a specific VP proof
   * @param vpToken The VP token containing the proof
   * @param proof The specific proof to verify
   * @param options Verification options
   * @returns Verification result with all proof-specific errors collected
   */
  private async verifyVpProof(
    vpToken: IVerifiablePresentation,
    proof: IProof,
    options: VerificationOptions,
  ): Promise<EnhancedVerificationResult> {
    const errors: string[] = [];

    try {
      // 1. Validate proof structure
      if (!proof.verificationMethod) {
        errors.push('Proof missing verification method');
      }

      if (!proof.proofValue) {
        errors.push('Proof missing proof value');
      }

      if (!proof.type) {
        errors.push('Proof missing type');
      }

      // Exit early if critical proof properties are missing
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0],
          errors: errors,
        };
      }

      // 2. Validate challenge and domain if specified in options
      if (options.nonce && proof.challenge !== options.nonce) {
        errors.push(
          `Challenge mismatch: expected '${options.nonce}', got '${proof.challenge || 'none'}'`,
        );
      }

      if (options.domain && proof.domain !== options.domain) {
        errors.push(
          `Domain mismatch: expected '${options.domain}', got '${proof.domain || 'none'}'`,
        );
      }

      // 3. Extract holder DID from the verification method ID
      let holderDid: string | null = null;
      try {
        holderDid = proof.verificationMethod.split('#')[0];
        if (!holderDid) {
          errors.push(`Invalid verification method ID: ${proof.verificationMethod}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        errors.push(`Failed to extract DID from verification method: ${proof.verificationMethod}`);
      }

      // 4. Compare holder property with verification method controller
      if (holderDid && vpToken.holder && vpToken.holder !== holderDid) {
        errors.push(
          `Holder (${vpToken.holder}) does not match verification method controller (${holderDid})`,
        );
      }

      // Skip further verification if there are structural errors
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0],
          errors: errors,
        };
      }

      // 5. Resolve verification method
      let verificationMethod: IVerificationMethod | null = null;
      try {
        verificationMethod = await this.resolveVerificationMethod(proof.verificationMethod);
        if (!verificationMethod) {
          errors.push(`Failed to resolve verification method: ${proof.verificationMethod}`);
        }
      } catch (error) {
        errors.push(
          `Error resolving verification method: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      // Skip signature verification if we couldn't resolve the verification method
      if (!verificationMethod || errors.length > 0) {
        return {
          valid: false,
          reason: errors[0],
          errors: errors,
        };
      }

      // 6. Get appropriate signature provider based on proof type
      let signatureType: SignatureType;
      let signatureProvider: ISignatureProvider | undefined;

      try {
        signatureType = this.getSignatureTypeFromProofType(proof.type);
        signatureProvider = this.signatureProviders.get(signatureType);

        if (!signatureProvider) {
          errors.push(`No signature provider available for proof type: ${proof.type}`);
        }
      } catch (error) {
        errors.push(
          `Error determining signature type: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      // Skip signature verification if we couldn't get a signature provider
      if (!signatureProvider || errors.length > 0) {
        return {
          valid: false,
          reason: errors[0],
          errors: errors,
        };
      }

      // 7. Prepare VP for verification by making a copy without the proof
      let vpWithoutProof;
      let canonicalVp: string;

      try {
        vpWithoutProof = this.removeProofsFromVp(vpToken);

        // 8. Generate the canonical form of the VP for verification
        canonicalVp = await this.canonicalizeVp(vpWithoutProof);
      } catch (error) {
        errors.push(
          `Error preparing VP for signature verification: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return {
          valid: false,
          reason: errors[0],
          errors: errors,
        };
      }

      // 9. Verify the signature
      try {
        const messageBytes = utf8ToBytes(canonicalVp);
        const messageHash = sha256(messageBytes);

        // Extract publicKeyHex from verificationMethod
        const publicKeyHex = await this.extractPublicKeyHex(verificationMethod);

        // Use verifySignature for verification
        await verifySignature(signatureProvider, proof.proofValue, messageHash, publicKeyHex, {
          skipHashing: true,
        });

        // If verifySignature doesn't throw, the signature is valid
        return { valid: true };
      } catch (error) {
        errors.push(
          `Error during signature verification: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return {
          valid: false,
          reason: errors[0],
          errors: errors,
        };
      }
    } catch (error) {
      return {
        valid: false,
        reason: `Error verifying VP proof: ${
          error instanceof Error ? error.message : String(error)
        }`,
        errors: [
          `Error verifying VP proof: ${error instanceof Error ? error.message : String(error)}`,
        ],
      };
    }
  }

  /**
   * Resolve a verification method from a DID document
   * @param verificationMethodId The verification method ID to resolve
   * @returns The resolved verification method or null if not found
   */
  private async resolveVerificationMethod(
    verificationMethodId: string,
  ): Promise<IVerificationMethod | null> {
    try {
      const didUrl = verificationMethodId.split('#')[0];
      const resolution = await this.didResolver.resolve(didUrl);

      if (!resolution.didDocument) {
        throw new Error(`DID document not found: ${didUrl}`);
      }

      const verificationMethod = resolution.didDocument.verificationMethod?.find(
        (vm) => vm.id === verificationMethodId,
      );

      return verificationMethod || null;
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
   * @param proofType The proof type to convert
   * @returns The corresponding signature type
   */
  private getSignatureTypeFromProofType(proofType: string): SignatureType {
    if (proofType.includes('Secp256k1')) {
      return 'Secp256k1';
    } else if (proofType.includes('JsonWebSignature')) {
      return 'JsonWebKey';
    }

    throw new Error(`Unsupported proof type: ${proofType}`);
  }

  /**
   * Remove proofs from a VP for signature verification
   * @param vpToken The VP token to modify
   * @returns A copy of the VP without proofs
   */
  private removeProofsFromVp(vpToken: any): any {
    // If null or not an object - return as-is
    if (vpToken === null || typeof vpToken !== 'object') {
      return vpToken;
    }

    // Handle arrays
    if (Array.isArray(vpToken)) {
      return vpToken.map((item) => this.removeProofsFromVp(item));
    }

    // Handle objects
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(vpToken)) {
      if (key !== 'proof') {
        result[key] = this.removeProofsFromVp(value);
      }
    }
    return result;
  }

  /**
   * Canonicalize a VP for signature verification
   * @param vp The VP to canonicalize
   * @returns The canonicalized string representation
   */
  private async canonicalizeVp(vp: Record<string, unknown>): Promise<string> {
    // For JSON-LD presentations, we'd use a JSON-LD canonicalization algorithm
    // For basic JSON, we'll use a simple deterministic serialization

    // This is a simplified approach - in production, use a proper JSON-LD canonicalization
    // like the one from jsonld-signatures library
    return JSON.stringify(this.sortObjectKeys(vp));
  }

  /**
   * Sort object keys for deterministic serialization
   * @param obj The object to sort keys for
   * @returns A new object with sorted keys
   */
  /**
   * Extract public key hex from a verification method
   * @param verificationMethod The verification method containing the public key
   * @returns The public key in hex format
   */
  private async extractPublicKeyHex(verificationMethod: IVerificationMethod): Promise<string> {
    // Handle both multibase and hex formats
    if (verificationMethod.publicKeyMultibase) {
      // strip 'z' prefix from multibase
      const base58Key = verificationMethod.publicKeyMultibase.startsWith('z')
        ? verificationMethod.publicKeyMultibase.slice(1)
        : verificationMethod.publicKeyMultibase;

      const keyBytes = base58.decode(base58Key);
      const hexKey = Buffer.from(keyBytes).toString('hex');

      if (hexKey.length === 70) {
        return hexKey.slice(4); // remove the 2-byte (4 hex chars) prefix
      } else {
        return hexKey;
      }
    } else if (verificationMethod.publicKeyHex) {
      return verificationMethod.publicKeyHex;
    }

    throw new Error('No supported public key format found in verification method');
  }

  /**
   * Sort object keys for deterministic serialization
   * @param obj Object to sort
   * @returns Sorted object
   */
  private sortObjectKeys(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sortObjectKeys(item));
    }

    // Type assertion since we know obj is a non-null object at this point
    const objRecord = obj as Record<string, unknown>;

    return Object.keys(objRecord)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = this.sortObjectKeys(objRecord[key]);
        return result;
      }, {});
  }
}
