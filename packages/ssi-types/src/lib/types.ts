import { ECDSASignature } from '@noble/curves/abstract/weierstrass.js';

export type KeyFormat = 'JWK' | 'Raw';
export type KeyType = 'JsonWebKey' | 'Ed25519' | 'Secp256k1';
export type Signature = Uint8Array | string | ECDSASignature;
export type SignatureType = 'Secp256r1' | 'Secp256k1' | 'JsonWebKey' | string;

export type JWK = {
  kid?: string;
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  d?: string;
  use?: string;
  alg?: string;
};

/**
 * Interface for signature providers that handle signing and verification operations
 *
 * This interface allows different implementations (software-based, KMS, HSM, etc.)
 * to be used interchangeably for signing and verification operations.
 *
 * Implementations should handle the specifics of how keys are managed:
 * - KmsProvider: Expects issuerId (string) as a key reference
 * - Secp256k1Provider: Expects actual private key (for wallet operations)
 */
export interface ISignatureProvider {
  /**
   * Signs arbitrary data using the provider's underlying key mechanism
   * (software, KMS, HSM, Vault, etc.)
   *
   * @param message - The data to sign (binary or base64/hex string)
   * @param privateKey - The private key material or reference
   * @param options - Optional provider-specific signing options
   * @returns The signature (string, typically base64 or hex)
   */
  sign(
    message: Uint8Array | string,
    privateKey: Uint8Array | string | bigint,
    options?: Record<string, unknown>,
  ): Promise<string>;

  /**
   * Verifies a signature using the provider's verification mechanism
   *
   * @param signature - The signature to verify
   * @param message - The signed data
   * @param publicKey - The public key used for verification
   * @param options - Optional provider-specific verification options
   * @returns True if signature is valid
   */
  verify(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    options?: Record<string, unknown>,
  ): Promise<boolean>;
}
