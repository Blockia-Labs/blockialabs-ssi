import { Ed25519Algorithm } from './Ed25519Algorithm.js';
import { ISigningAlgorithm } from '../interfaces/ISigningAlgorithm.js';
import { KeyType } from '@blockialabs/ssi-types';
import { Secp256k1Algorithm } from './Secp256k1Algorithm.js';

export class SigningAlgorithmFactory {
  private algorithms: Map<KeyType, ISigningAlgorithm>;

  constructor() {
    this.algorithms = new Map([
      ['Ed25519', new Ed25519Algorithm()],
      ['Secp256k1', new Secp256k1Algorithm()],
    ]);
  }

  getAlgorithm(type: KeyType): ISigningAlgorithm {
    const algorithm = this.algorithms.get(type);
    if (!algorithm) {
      throw new Error(`Unsupported algorithm: ${type}`);
    }
    return algorithm;
  }

  registerAlgorithm(type: KeyType, algorithm: ISigningAlgorithm): void {
    this.algorithms.set(type, algorithm);
  }
}
