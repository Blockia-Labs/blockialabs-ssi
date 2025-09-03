import { Ed25519Algorithm } from '../../algorithms/Ed25519Algorithm.js';
import { Key } from '../../keys/Key.js';

describe('Ed25519Algorithm', () => {
  const algorithm = new Ed25519Algorithm();
  let testKey: Key;

  beforeEach(async () => {
    testKey = await algorithm.generateKeyPair('Ed25519');
  });

  describe('generateKey', () => {
    it('should generate valid Ed25519 key pair', async () => {
      expect(testKey.type).toBe('Ed25519');
      expect(testKey.publicKey).toBeInstanceOf(Uint8Array);
      expect(testKey.publicKey.length).toBe(32);
      expect(testKey.privateKey).toBeInstanceOf(Uint8Array);
      expect(testKey.privateKey.length).toBe(32);
    });

    it('should throw error for wrong key type', async () => {
      await expect(algorithm.generateKeyPair('Secp256k1')).rejects.toThrow(
        'Ed25519Algorithm only supports Ed25519 keys',
      );
    });
  });

  describe('sign and verify', () => {
    const message = new TextEncoder().encode('test message');

    it('should sign and verify message successfully', async () => {
      const signature = await algorithm.sign(message, testKey);
      const isValid = await algorithm.verify(signature, message, testKey);
      expect(isValid).toBe(true);
    });

    it('should fail verification for tampered message', async () => {
      const signature = await algorithm.sign(message, testKey);
      const tamperedMessage = new TextEncoder().encode('tampered message');
      const isValid = await algorithm.verify(signature, tamperedMessage, testKey);
      expect(isValid).toBe(false);
    });

    it('should throw error when signing with wrong key type', async () => {
      const wrongKey = new Key(new Uint8Array(32), new Uint8Array(32), 'Secp256k1');
      await expect(algorithm.sign(message, wrongKey)).rejects.toThrow(
        'Invalid key type for Ed25519Algorithm',
      );
    });
  });
});
