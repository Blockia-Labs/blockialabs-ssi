import { secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes, hexToBytes } from '@noble/hashes/utils.js';

/**
 * SECP256K1 signature provider
 */
export class Secp256k1Signer {
  public sign(message: string, privateKeyHex: string): Uint8Array {
    const messageBytes = utf8ToBytes(message);
    const messageHash = sha256(messageBytes);
    const privateKeyBytes = hexToBytes(privateKeyHex);

    const signature = secp256k1.sign(messageHash, privateKeyBytes);
    return signature.toBytes('compact');
  }
}
