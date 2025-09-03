import { CryptoUtils } from '../core/crypto/crypto-utils.js';
import { ValidationError, CryptographyError } from '../utils/errors.js';

describe('CryptoUtils', () => {
  describe('generateMnemonic', () => {
    it('should generate a valid mnemonic with default entropy', () => {
      const mnemonic = CryptoUtils.generateMnemonic();
      expect(mnemonic.split(' ').length).toBeGreaterThanOrEqual(12);
    });

    it('should generate different mnemonics for subsequent calls', () => {
      const mnemonic1 = CryptoUtils.generateMnemonic();
      const mnemonic2 = CryptoUtils.generateMnemonic();
      expect(mnemonic1).not.toBe(mnemonic2);
    });

    it('should throw for invalid entropy sizes', () => {
      expect(() => CryptoUtils.generateMnemonic(100)).toThrow(ValidationError);
    });
  });

  describe('validateMnemonic', () => {
    it('should validate a correct mnemonic', () => {
      const mnemonic =
        'legal winner thank year wave sausage worth useful legal winner thank yellow';
      expect(CryptoUtils.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should reject invalid mnemonics', () => {
      expect(CryptoUtils.validateMnemonic('invalid mnemonic phrase')).toBe(false);
    });
  });

  describe('mnemonicToSeed', () => {
    it('should generate seed from mnemonic', async () => {
      const mnemonic =
        'legal winner thank year wave sausage worth useful legal winner thank yellow';
      const seed = await CryptoUtils.mnemonicToSeed(mnemonic);
      expect(seed).toBeInstanceOf(Uint8Array);
      expect(seed.length).toBe(64);
    });

    it('should throw for invalid mnemonic', async () => {
      await expect(CryptoUtils.mnemonicToSeed('invalid')).rejects.toThrow(CryptographyError);
    });
  });

  describe('key derivation', () => {
    const testMnemonic =
      'legal winner thank year wave sausage worth useful legal winner thank yellow';

    it('should create master key from seed', async () => {
      const seed = await CryptoUtils.mnemonicToSeed(testMnemonic);
      const masterKey = CryptoUtils.createMasterKey(seed);
      expect(masterKey).toBeDefined();
      expect(masterKey.privateKey).toBeDefined();
    });

    it('should derive child key', async () => {
      const seed = await CryptoUtils.mnemonicToSeed(testMnemonic);
      const masterKey = CryptoUtils.createMasterKey(seed);
      const childKey = CryptoUtils.deriveChildKey(masterKey, "m/44'/60'/0'/0", 0);
      expect(childKey.privateKey).toBeDefined();
      expect(childKey.publicKey).toBeDefined();
    });

    it('should throw for invalid derivation path', async () => {
      const seed = await CryptoUtils.mnemonicToSeed(testMnemonic);
      const masterKey = CryptoUtils.createMasterKey(seed);
      expect(() => CryptoUtils.deriveChildKey(masterKey, 'invalid_path', 0)).toThrow(
        CryptographyError,
      );
    });
  });

  describe('message signing', () => {
    it('should hash message correctly', () => {
      const message = 'test message';
      const hash = CryptoUtils.hashMessage(message);
      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32);
    });
  });
});
