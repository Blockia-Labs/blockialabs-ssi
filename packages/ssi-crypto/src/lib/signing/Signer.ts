import { IKeyManager } from '../interfaces/IKeyManager.js';
import { ISigner } from '../interfaces/ISigner.js';
import { Key } from '../keys/Key.js';
import { KeyType } from '@blockialabs/ssi-types';
import { SigningAlgorithmFactory } from '../algorithms/SigningAlgorithmFactory.js';

// TODO: Implement dependency injection for crypto algorithms to improve testability
// TODO: Remove the keyType in Key class by injecting the algorithm directly
export class Signer implements ISigner {
  constructor(
    private readonly keyManager: IKeyManager,
    private readonly algorithmFactory: SigningAlgorithmFactory,
  ) {}

  async createKey(type: KeyType): Promise<Key> {
    return this.keyManager.createKey(type);
  }

  async sign(message: Uint8Array, key: Key): Promise<Uint8Array> {
    const algorithm = this.algorithmFactory.getAlgorithm(key.type);
    return algorithm.sign(message, key);
  }

  async verify(signature: Uint8Array, message: Uint8Array, key: Key): Promise<boolean> {
    const algorithm = this.algorithmFactory.getAlgorithm(key.type);
    return algorithm.verify(signature, message, key);
  }
}
