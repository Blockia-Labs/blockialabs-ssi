import { ISigningAlgorithm } from '../interfaces/ISigningAlgorithm.js';
import { Key } from '../keys/Key.js';
import { KeyType } from '@blockialabs/ssi-types';
import { secp256k1 } from '@noble/curves/secp256k1.js';

export class Secp256k1Algorithm implements ISigningAlgorithm {
  async generateKeyPair(type: KeyType): Promise<Key> {
    if (type !== 'Secp256k1') {
      throw new Error('Secp256k1Algorithm only supports Secp256k1 keys');
    }
    const { secretKey, publicKey } = secp256k1.keygen();
    return new Key(publicKey, secretKey, type);
  }

  async generatePrivateKey(type: KeyType): Promise<Uint8Array> {
    if (type !== 'Secp256k1') {
      throw new Error('Secp256k1Algorithm only supports Secp256k1 keys');
    }
    const { secretKey } = secp256k1.keygen();
    return secretKey;
  }

  async derivePublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    return secp256k1.getPublicKey(privateKey, true); // Compressed public key
  }

  async sign(message: Uint8Array, key: Key): Promise<Uint8Array> {
    if (key.type !== 'Secp256k1') {
      throw new Error('Invalid key type for Secp256k1Algorithm');
    }
    if (!key.privateKey) {
      throw new Error('Private key required for signing');
    }
    const signature = secp256k1.sign(message, key.privateKey);
    return signature.toBytes('compact');
  }

  async verify(signature: Uint8Array, message: Uint8Array, key: Key): Promise<boolean> {
    if (key.type !== 'Secp256k1') {
      throw new Error('Invalid key type for Secp256k1Algorithm');
    }
    return secp256k1.verify(signature, message, key.publicKey);
  }

  async encrypt(): Promise<Uint8Array> {
    throw new Error('Secp256k1 does not support encryption');
  }

  async decrypt(): Promise<Uint8Array> {
    throw new Error('Secp256k1 does not support decryption');
  }
}
