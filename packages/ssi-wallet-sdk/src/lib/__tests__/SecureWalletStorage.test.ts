import { SecureWalletStorage } from '../core/wallet/SecureWalletStorage.js';
import { InMemoryStorage } from '../core/shared/InMemoryStorage.js';
import { CryptographyError } from '../utils/errors.js';

describe('SecureWalletStorage', () => {
  let secureStorage: SecureWalletStorage;
  let memoryStorage: InMemoryStorage;
  const testPasscode = 'test-passcode-123';
  const testMnemonic =
    'legal winner thank year wave sausage worth useful legal winner thank yellow';

  beforeEach(() => {
    memoryStorage = new InMemoryStorage();
    secureStorage = new SecureWalletStorage(memoryStorage);
  });

  describe('exists', () => {
    it('should return false for new storage', async () => {
      const exists = await secureStorage.exists();
      expect(exists).toBe(false);
    });

    it('should return true after saving', async () => {
      await secureStorage.save(testMnemonic, testPasscode);
      const exists = await secureStorage.exists();
      expect(exists).toBe(true);
    });
  });

  describe('save and load', () => {
    it('should encrypt and decrypt mnemonic', async () => {
      await secureStorage.save(testMnemonic, testPasscode);
      const loaded = await secureStorage.load(testPasscode);
      expect(loaded).toBe(testMnemonic);
    });

    it('should fail with wrong passcode', async () => {
      await secureStorage.save(testMnemonic, testPasscode);
      await expect(secureStorage.load('wrong-passcode')).rejects.toThrow(CryptographyError);
    });
  });

  describe('remove', () => {
    it('should remove wallet', async () => {
      await secureStorage.save(testMnemonic, testPasscode);
      await secureStorage.remove();

      const exists = await secureStorage.exists();
      expect(exists).toBe(false);
    });
  });
});
