import { ISignatureProvider } from '@blockialabs/ssi-types';

/**
 * KMS Provider (for issuer/custodial signing)
 *
 * This provider uses a key management service to sign and verify data.
 * It expects keyId as a reference to the key in the KMS, not the actual private key.
 */
export class KmsProvider implements ISignatureProvider {
  /**
   * Create a new KMS provider
   * @param keyStore An object that implements the ISignatureProvider interface
   */
  constructor(private readonly keyStore: ISignatureProvider) {}

  /**
   * Sign a message using the KMS
   *
   * @param message - The message to sign
   * @param privateKey - This is actually the keyId for KMS provider
   * @param options - Optional provider-specific signing options
   * @returns Promise resolving to the signature
   */
  async sign(
    message: Uint8Array | string,
    privateKey: Uint8Array | string | bigint,
    options?: Record<string, unknown>,
  ): Promise<string> {
    return this.keyStore.sign(message, privateKey, options);
  }

  /**
   * Verify a signature using the KMS
   *
   * @param signature - The signature to verify
   * @param message - The message that was signed (pre-hashed if needed by KMS)
   * @param publicKey - The public key to verify against
   * @param options - Optional provider-specific verification options
   * @returns Promise resolving to true if signature is valid
   */
  async verify(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    options?: Record<string, unknown>,
  ): Promise<boolean> {
    return this.keyStore.verify(signature, message, publicKey, options);
  }
}
