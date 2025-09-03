import { base58, base64url } from '@scure/base';
import { CredentialError, CredentialErrorCode } from '../types/errors.js';
import { CredentialProof, ProofValidationOptions } from '../types.js';
import { IDIDResolver } from '@blockialabs/ssi-did';
import { IProofValidator } from '../interfaces/index.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { JWTHeader, JWTPayload } from '../types/jwt.js';
import { KeyDIDMethod, KeyDIDResolver } from '@blockialabs/ssi-did-key';
import { verifySignature } from '@blockialabs/ssi-utils';

export class JWTProofValidator implements IProofValidator {
  constructor(
    private readonly didResolver: IDIDResolver = new KeyDIDResolver(new KeyDIDMethod()),
    private readonly signatureProvider: ISignatureProvider,
  ) {}

  public async validate(proof: CredentialProof, opts: ProofValidationOptions): Promise<void> {
    if (!proof.jwt) {
      throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'JWT proof value is required');
    }

    const { header, payload, signature } = this.decodeJWTParts(proof.jwt);

    if (header.typ !== 'openid4vci-proof+jwt' || !header.alg || header.alg === 'none') {
      throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'Invalid JWT header');
    }

    this.validateClaims(payload, opts);

    const publicKeyHex = await this.getVerificationKey(header);

    const [headerB64, payloadB64] = proof.jwt.split('.', 2);
    const message = `${headerB64}.${payloadB64}`;

    try {
      await verifySignature(this.signatureProvider, signature, message, publicKeyHex);
    } catch {
      throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'Invalid signature');
    }
  }

  private decodeJWTParts(jwt: string): {
    header: JWTHeader;
    payload: JWTPayload;
    signature: Uint8Array;
  } {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'Invalid JWT format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    try {
      const headerBytes = base64url.decode(headerB64);
      const payloadBytes = base64url.decode(payloadB64);

      // Convert bytes to string for JSON parsing
      const headerText = Buffer.from(headerBytes).toString('utf8');
      const payloadText = Buffer.from(payloadBytes).toString('utf8');

      const header = JSON.parse(headerText);
      const payload = JSON.parse(payloadText);
      const signature = base64url.decode(signatureB64);

      return {
        header,
        payload,
        signature,
      };
    } catch (error) {
      throw new CredentialError(
        CredentialErrorCode.INVALID_PROOF,
        `Invalid JWT encoding: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private validateClaims(payload: JWTPayload, opts: ProofValidationOptions): void {
    // Validate audience
    if (!payload.aud || payload.aud !== opts.expectedAudience) {
      throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'Invalid audience');
    }

    // Validate nonce if provided
    if (opts.expectedNonce && payload.nonce !== opts.expectedNonce) {
      throw new CredentialError(CredentialErrorCode.INVALID_NONCE, 'Invalid nonce');
    }

    // Validate timestamp
    if (!payload.iat) {
      throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'Missing iat claim');
    }

    const now = Math.floor(Date.now() / 1000);
    // 5 minute window (300 seconds)
    if (Math.abs(now - payload.iat) > 300) {
      throw new CredentialError(
        CredentialErrorCode.INVALID_PROOF,
        'JWT timestamp is outside acceptable window',
      );
    }
  }

  private async getVerificationKey(header: JWTHeader): Promise<string> {
    // Case 1: Direct JWK in header
    if (header.jwk) {
      const keyBytes = base64url.decode(header.jwk.x);
      return Buffer.from(keyBytes).toString('hex');
    }

    // Case 2: DID reference
    if (header.kid) {
      if (!this.didResolver) {
        throw new CredentialError(
          CredentialErrorCode.INVALID_PROOF,
          'DID resolver required for kid verification',
        );
      }

      // Extract the DID from the kid
      const didMatch = header.kid.match(/^(did:[a-zA-Z0-9:]+[a-zA-Z0-9]*)(.*)/);
      if (!didMatch) {
        throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'Invalid DID format in kid');
      }

      const did = didMatch[1];
      const didDoc = await this.didResolver.resolve(did);

      if (!didDoc) {
        throw new CredentialError(
          CredentialErrorCode.INVALID_PROOF,
          `Failed to resolve DID: ${did}`,
        );
      }

      // Find the verification method that matches the key identifier
      const verificationMethod = didDoc.didDocument?.verificationMethod?.find(
        (vm) => vm.id === header.kid,
      );

      if (!verificationMethod) {
        throw new CredentialError(
          CredentialErrorCode.INVALID_PROOF,
          `Verification method not found: ${header.kid}`,
        );
      }

      // Handle the publicKeyMultibase field
      if (verificationMethod.publicKeyMultibase) {
        try {
          const multibaseKey = verificationMethod.publicKeyMultibase;

          // Check for base58 encoding
          if (multibaseKey[0] === 'z') {
            const decodedKey = base58.decode(multibaseKey.slice(1));
            return Buffer.from(decodedKey).toString('hex');
          } else {
            throw new CredentialError(
              CredentialErrorCode.INVALID_PROOF,
              `Unsupported multibase prefix: ${multibaseKey[0]}`,
            );
          }
        } catch (error) {
          throw new CredentialError(
            CredentialErrorCode.INVALID_PROOF,
            `Invalid publicKeyMultibase format: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      } else {
        throw new CredentialError(
          CredentialErrorCode.INVALID_PROOF,
          'Invalid or missing public key in DID document. Expected publicKeyMultibase',
        );
      }
    }

    throw new CredentialError(
      CredentialErrorCode.INVALID_PROOF,
      'JWT must contain either jwk or kid in header',
    );
  }
}
