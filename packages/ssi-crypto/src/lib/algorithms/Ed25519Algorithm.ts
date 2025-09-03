import { ed25519 } from '@noble/curves/ed25519.js';
import { ISigningAlgorithm } from '../interfaces/ISigningAlgorithm.js';
import { Key } from '../keys/Key.js';
import { KeyType } from '@blockialabs/ssi-types';

export class Ed25519Algorithm implements ISigningAlgorithm {
  async generateKeyPair(type: KeyType): Promise<Key> {
    if (type !== 'Ed25519') {
      throw new Error('Ed25519Algorithm only supports Ed25519 keys');
    }
    const { secretKey, publicKey } = ed25519.keygen();
    return new Key(publicKey, secretKey, type);
  }

  async generatePrivateKey(type: KeyType): Promise<Uint8Array> {
    if (type !== 'Ed25519') {
      throw new Error('Ed25519Algorithm only supports Ed25519 keys');
    }
    const { secretKey } = ed25519.keygen();
    return secretKey;
  }

  async derivePublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    return ed25519.getPublicKey(privateKey);
  }

  async sign(message: Uint8Array, key: Key): Promise<Uint8Array> {
    if (key.type !== 'Ed25519') {
      throw new Error('Invalid key type for Ed25519Algorithm');
    }
    if (!key.privateKey) {
      throw new Error('Private key required for signing');
    }
    return ed25519.sign(message, key.privateKey);
  }

  async verify(signature: Uint8Array, message: Uint8Array, key: Key): Promise<boolean> {
    if (key.type !== 'Ed25519') {
      throw new Error('Invalid key type for Ed25519Algorithm');
    }
    return ed25519.verify(signature, message, key.publicKey);
  }

  async encrypt(): Promise<Uint8Array> {
    throw new Error('Ed25519 does not support encryption');
  }

  async decrypt(): Promise<Uint8Array> {
    throw new Error('Ed25519 does not support decryption');
  }
}
