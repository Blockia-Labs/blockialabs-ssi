import { Ed25519Algorithm } from '../../algorithms/Ed25519Algorithm.js';
import { KeyType } from '@blockialabs/ssi-types';
import { Secp256k1Algorithm } from '../../algorithms/Secp256k1Algorithm.js';
import { SigningAlgorithmFactory } from '../../algorithms/SigningAlgorithmFactory.js';

describe('SigningAlgorithmFactory', () => {
  let factory: SigningAlgorithmFactory;

  beforeEach(() => {
    factory = new SigningAlgorithmFactory();
  });

  it('should return Ed25519Algorithm for Ed25519 type', () => {
    const algorithm = factory.getAlgorithm('Ed25519');
    expect(algorithm).toBeInstanceOf(Ed25519Algorithm);
  });

  it('should return Secp256k1Algorithm for Secp256k1 type', () => {
    const algorithm = factory.getAlgorithm('Secp256k1');
    expect(algorithm).toBeInstanceOf(Secp256k1Algorithm);
  });

  it('should throw error for unsupported algorithm type', () => {
    expect(() => {
      factory.getAlgorithm('UnsupportedType' as KeyType);
    }).toThrow('Unsupported algorithm: UnsupportedType');
  });

  it('should allow registering new algorithms', () => {
    const mockAlgorithm = {
      generateKeyPair: jest.fn(),
      generatePrivateKey: jest.fn(),
      derivePublicKey: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    factory.registerAlgorithm('TestAlgo' as KeyType, mockAlgorithm);
    const retrieved = factory.getAlgorithm('TestAlgo' as KeyType);
    expect(retrieved).toBe(mockAlgorithm);
  });
});
