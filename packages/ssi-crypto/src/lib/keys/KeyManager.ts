import { base64url } from '@scure/base';
import { createHash } from 'crypto';
import { IKeyManager } from '../interfaces/IKeyManager.js';
import { IKeyStore } from '../interfaces/IKeyStore.js';
import { Key } from './Key.js';
import { KeyFormat, KeyType } from '@blockialabs/ssi-types';
import { SigningAlgorithmFactory } from '../algorithms/SigningAlgorithmFactory.js';

// TODO: Implement dependency injection for crypto algorithms to improve testability
// TODO: Extract storage to a separate service for better separation of concerns
// TODO: Add key rotation policies and audit logging for security compliance
export class KeyManager implements IKeyManager {
  constructor(
    private readonly keyStore: IKeyStore,
    private readonly algorithmFactory: SigningAlgorithmFactory,
  ) {}

  async createKey(type: KeyType): Promise<Key> {
    const algorithm = this.algorithmFactory.getAlgorithm(type);
    const keyPair = await algorithm.generateKeyPair(type);
    const kid = await this.generateKid(keyPair.publicKey);
    const jwk = keyPair.toJWK();
    jwk.kid = kid;
    await this.keyStore.saveKey(kid, jwk);
    return keyPair;
  }

  async rotateKey(kid: string): Promise<Key> {
    const oldKey = await this.keyStore.getKey(kid);
    if (!oldKey) throw new Error(`Key not found: ${kid}`);

    const type = oldKey.crv === 'Ed25519' ? 'Ed25519' : 'Secp256k1';
    const algorithm = this.algorithmFactory.getAlgorithm(type);
    const newKeyPair = await algorithm.generateKeyPair(type);

    await this.keyStore.deleteKey(kid);
    const newKid = await this.generateKid(newKeyPair.publicKey);
    const jwk = newKeyPair.toJWK();
    jwk.kid = newKid;
    await this.keyStore.saveKey(newKid, jwk);
    return newKeyPair;
  }

  async exportKey(kid: string, format: KeyFormat): Promise<string> {
    const key = await this.keyStore.getKey(kid);
    if (!key) throw new Error(`Key not found: ${kid}`);
    if (!key.x) throw new Error('Key is missing x coordinate');
    return format === 'JWK' ? JSON.stringify(key) : key.x;
  }

  async importKey(key: string, format: KeyFormat): Promise<Key> {
    const jwk = format === 'JWK' ? JSON.parse(key) : { kty: 'EC', x: key };
    const kid = await this.generateKid(base64url.decode(jwk.x));
    await this.keyStore.saveKey(kid, jwk);
    return Key.fromJWK(jwk);
  }

  private async generateKid(publicKey: Uint8Array): Promise<string> {
    const hash = createHash('sha256');
    hash.update(publicKey);
    return hash.digest('base64url');
  }
}
