import { base64url } from '@scure/base';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';

/**
 * Convert string or Uint8Array input to Uint8Array.
 * For strings, allows specifying whether input is hex encoded or base64.
 */
// TODO: Move to utils and check duplicate with Secp256k1Provider normalizeSecretKey
function toUint8Array(
  input: string | Uint8Array,
  format: 'hex' | 'utf8' | 'base64' = 'utf8',
): Uint8Array {
  if (input instanceof Uint8Array) return input;
  if (format === 'hex') return hexToBytes(input);
  if (format === 'base64') return base64url.decode(input);
  return utf8ToBytes(input);
}

export async function verifySignature(
  signatureProvider: ISignatureProvider,
  signature: string | Uint8Array,
  message: string | Uint8Array,
  publicKey: string | Uint8Array,
  options?: Record<string, unknown>,
): Promise<void> {
  const signatureBytes = toUint8Array(signature, 'base64');
  const messageBytes = toUint8Array(message);
  const publicKeyBytes = toUint8Array(publicKey, 'hex');

  const isValid = await signatureProvider.verify(
    signatureBytes,
    messageBytes,
    publicKeyBytes,
    options,
  );

  if (!isValid) {
    throw new Error(
      'Signature verification failed. This could indicate:\n' +
        '1. The signature was generated with a different private key\n' +
        '2. The message was modified after signing\n' +
        '3. The signature format is incorrect',
    );
  }
}
