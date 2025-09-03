import { IKeyStore } from '../../interfaces/IKeyStore.js';
import { Key } from '../../keys/Key.js';
import { KeyManager } from '../../keys/KeyManager.js';
import { Signer } from '../../signing/Signer.js';
import { SigningAlgorithmFactory } from '../../algorithms/SigningAlgorithmFactory.js';

describe('Signer', () => {
  let signer: Signer;
  let keyManager: KeyManager;
  let mockKeyStore: jest.Mocked<IKeyStore>;

  beforeEach(() => {
    mockKeyStore = {
      saveKey: jest.fn(),
      getKey: jest.fn(),
      deleteKey: jest.fn(),
      listKeys: jest.fn(),
    };
    const algorithmFactory = new SigningAlgorithmFactory();
    keyManager = new KeyManager(mockKeyStore, algorithmFactory);
    signer = new Signer(keyManager, algorithmFactory);
  });

  describe('createSigningKey', () => {
    it('should create Ed25519 signing key', async () => {
      const key = await signer.createKey('Ed25519');
      expect(key).toBeInstanceOf(Key);
      expect(key.type).toBe('Ed25519');
    });

    it('should create Secp256k1 signing key', async () => {
      const key = await signer.createKey('Secp256k1');
      expect(key).toBeInstanceOf(Key);
      expect(key.type).toBe('Secp256k1');
    });
  });

  describe('sign and verify', () => {
    let testKey: Key;
    const message = new TextEncoder().encode('test message');

    beforeEach(async () => {
      testKey = await signer.createKey('Ed25519');
    });

    it('should sign and verify message successfully', async () => {
      const signature = await signer.sign(message, testKey);
      const isValid = await signer.verify(signature, message, testKey);
      expect(isValid).toBe(true);
    });

    it('should fail verification for tampered message', async () => {
      const signature = await signer.sign(message, testKey);
      const tamperedMessage = new TextEncoder().encode('tampered message');
      const isValid = await signer.verify(signature, tamperedMessage, testKey);
      expect(isValid).toBe(false);
    });
  });
});
