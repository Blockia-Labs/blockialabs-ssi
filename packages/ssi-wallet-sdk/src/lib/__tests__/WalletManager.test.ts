import { Wallet } from '../core/wallet/Wallet.js';
import { WalletManager } from '../core/wallet/WalletManager.js';
import { SecureWalletStorage } from '../core/wallet/SecureWalletStorage.js';
import { InMemoryStorage } from '../core/shared/InMemoryStorage.js';
import { ValidationError, CryptographyError, StorageError } from '../utils/errors.js';

describe('WalletManager', () => {
  let walletManager: WalletManager;
  let storage: SecureWalletStorage;
  const testPasscode = 'test-passcode-123';
  const testMnemonic =
    'legal winner thank year wave sausage worth useful legal winner thank yellow';

  beforeEach(() => {
    const memoryStorage = new InMemoryStorage();
    storage = new SecureWalletStorage(memoryStorage);
    walletManager = new WalletManager(storage);
  });

  describe('walletExists', () => {
    it('should return false for new storage', async () => {
      const exists = await walletManager.walletExists();
      expect(exists).toBe(false);
    });

    it('should return true after wallet creation', async () => {
      await walletManager.createWallet(testPasscode);
      const exists = await walletManager.walletExists();
      expect(exists).toBe(true);
    });
  });

  describe('createWallet', () => {
    it('should create and store a new wallet', async () => {
      const wallet = await walletManager.createWallet(testPasscode);
      expect(wallet).toBeInstanceOf(Wallet);
      expect(wallet.accountIndex).toBe(0);
    });
  });

  describe('importWallet', () => {
    it('should import and store a wallet', async () => {
      const wallet = await walletManager.importWallet(testMnemonic, testPasscode);
      expect(wallet).toBeInstanceOf(Wallet);
      expect(wallet.mnemonic).toBe(testMnemonic);
    });

    it('should throw for invalid mnemonic', async () => {
      await expect(walletManager.importWallet('invalid mnemonic', testPasscode)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('loadWallet', () => {
    it('should load existing wallet', async () => {
      await walletManager.createWallet(testPasscode);
      const loadedWallet = await walletManager.loadWallet(testPasscode);
      expect(loadedWallet).toBeInstanceOf(Wallet);
    });

    it('should throw for wrong passcode', async () => {
      await walletManager.createWallet(testPasscode);
      await expect(walletManager.loadWallet('wrong-passcode')).rejects.toThrow(CryptographyError);
    });

    it('should throw when no wallet exists', async () => {
      await expect(walletManager.loadWallet(testPasscode)).rejects.toThrow(StorageError);
    });
  });

  describe('deriveMultipleAccounts', () => {
    it('should derive multiple accounts', async () => {
      await walletManager.createWallet(testPasscode);
      const accountCount = 3;
      const wallets = await walletManager.deriveMultipleAccounts(testPasscode, accountCount);
      expect(wallets.length).toBe(accountCount);
      expect(wallets[0].accountIndex).toBe(0);
      expect(wallets[1].accountIndex).toBe(1);
      expect(wallets[2].accountIndex).toBe(2);
    });

    it('should validate account count', async () => {
      await expect(walletManager.deriveMultipleAccounts(testPasscode, 0)).rejects.toThrow(
        ValidationError,
      );
      await expect(walletManager.deriveMultipleAccounts(testPasscode, 101)).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('changePasscode', () => {
    it('should change passcode successfully', async () => {
      await walletManager.createWallet(testPasscode);
      const newPasscode = 'new-passcode-456';
      await walletManager.changePasscode(testPasscode, newPasscode);
      await expect(walletManager.loadWallet(newPasscode)).resolves.toBeInstanceOf(Wallet);
    });

    it('should throw for wrong old passcode', async () => {
      await walletManager.createWallet(testPasscode);
      await expect(
        walletManager.changePasscode('wrong-old-passcode', 'new-passcode'),
      ).rejects.toThrow(CryptographyError);
    });
  });

  describe('deleteWallet', () => {
    it('should delete wallet', async () => {
      await walletManager.createWallet(testPasscode);
      await walletManager.deleteWallet();
      await expect(walletManager.walletExists()).resolves.toBe(false);
    });
  });
});
