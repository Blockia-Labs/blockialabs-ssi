import { base64url } from '@scure/base';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes, hexToBytes } from '@noble/hashes/utils.js';

/**
 * Secp256k1 Provider (for wallet/non-custodial signing)
 *
 * This provider uses the secp256k1 curve for signing and verification.
 * It expects the actual private key for signing, not a key reference.
 * Primarily used for wallet operations where the wallet holds the key.
 */
export class Secp256k1Provider implements ISignatureProvider {
  async sign(
    message: Uint8Array | string,
    privateKey: Uint8Array | string | bigint,
    options?: Record<string, unknown>,
  ): Promise<string> {
    const messageBytes = typeof message === 'string' ? utf8ToBytes(message) : message;
    const messageHash = sha256(messageBytes);

    const privateKeyBytes = this.normalizeSecretKey(privateKey);

    const signatureBytes = secp256k1.sign(messageHash, privateKeyBytes, options);
    const signatureB64Url = base64url.encode(signatureBytes);

    return signatureB64Url;
  }

  async verify(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    options?: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      const messageToVerify = options?.skipHashing === true ? message : sha256(message);
      const result = secp256k1.verify(signature, messageToVerify, publicKey, options);
      return result;
    } catch (error) {
      console.error('[Secp256k1Provider] Verification error:', error);
      return false;
    }
  }

  // TODO: Move to utils
  private normalizeSecretKey(privateKey: Uint8Array | string | bigint): Uint8Array {
    if (privateKey instanceof Uint8Array) return privateKey;
    if (typeof privateKey === 'string') return hexToBytes(privateKey);
    if (typeof privateKey === 'bigint') {
      const hex = privateKey.toString(16).padStart(64, '0');
      return hexToBytes(hex);
    }
    throw new Error('Invalid secret key type');
  }
}
