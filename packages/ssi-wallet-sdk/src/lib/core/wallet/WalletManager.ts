import { WALLET_DEFAULTS, WALLET_LIMITS } from '../../utils/constants.js';
import { Wallet } from './Wallet.js';
import { WalletConfig } from '../../types/index.js';
import { SecureWalletStorage } from './SecureWalletStorage.js';
import { CryptographyError, ValidationError } from '../../utils/errors.js';

export class WalletManager {
  private readonly config: WalletConfig;

  constructor(
    private readonly storage: SecureWalletStorage,
    configOverrides: Partial<WalletConfig> = {},
  ) {
    this.config = { ...WALLET_DEFAULTS, ...configOverrides };
  }

  async walletExists(): Promise<boolean> {
    return this.storage.exists();
  }

  async createWallet(passcode: string, passphrase?: string): Promise<Wallet> {
    const mnemonic = this.generateMnemonic();
    const wallet = await this.createWalletFromMnemonic(mnemonic, 0, passphrase);
    await this.saveMnemonic(mnemonic, passcode);
    return wallet;
  }

  async importWallet(mnemonic: string, passcode: string, passphrase?: string): Promise<Wallet> {
    this.validateMnemonic(mnemonic);
    const wallet = await this.createWalletFromMnemonic(mnemonic, 0, passphrase);
    await this.saveMnemonic(mnemonic, passcode);
    return wallet;
  }

  async loadWallet(passcode: string, accountIndex = 0, passphrase?: string): Promise<Wallet> {
    const mnemonic = await this.loadMnemonic(passcode);
    return this.createWalletFromMnemonic(mnemonic, accountIndex, passphrase);
  }

  async exportMnemonic(passcode: string): Promise<string> {
    return this.loadMnemonic(passcode);
  }

  async deriveMultipleAccounts(
    passcode: string,
    accountCount: number,
    passphrase?: string,
  ): Promise<Wallet[]> {
    this.validateAccountCount(accountCount);
    const mnemonic = await this.loadMnemonic(passcode);
    return this.createMultipleWallets(mnemonic, accountCount, passphrase);
  }

  async changePasscode(oldPasscode: string, newPasscode: string): Promise<void> {
    const mnemonic = await this.loadMnemonic(oldPasscode);
    await this.saveMnemonic(mnemonic, newPasscode);
  }

  async deleteWallet(): Promise<void> {
    return this.storage.remove();
  }

  private generateMnemonic(): string {
    try {
      return Wallet.generateMnemonic(this.config.entropySize);
    } catch {
      throw new CryptographyError('Failed to generate mnemonic');
    }
  }

  private validateMnemonic(mnemonic: string): void {
    if (!Wallet.validateMnemonic(mnemonic)) {
      throw new ValidationError('Invalid mnemonic phrase');
    }
  }

  private validateAccountCount(count: number): void {
    if (count < WALLET_LIMITS.MIN_ACCOUNTS) {
      throw new ValidationError(`Account count must be at least ${WALLET_LIMITS.MIN_ACCOUNTS}`);
    }
    if (count > WALLET_LIMITS.MAX_ACCOUNTS) {
      throw new ValidationError(`Account count cannot exceed ${WALLET_LIMITS.MAX_ACCOUNTS}`);
    }
  }

  private async createWalletFromMnemonic(
    mnemonic: string,
    accountIndex: number,
    passphrase?: string,
  ): Promise<Wallet> {
    return Wallet.fromMnemonic(mnemonic, this.config.derivationPath, accountIndex, passphrase);
  }

  private async saveMnemonic(mnemonic: string, passcode: string): Promise<void> {
    return this.storage.save(mnemonic, passcode);
  }

  private async loadMnemonic(passcode: string): Promise<string> {
    return this.storage.load(passcode);
  }

  private async createMultipleWallets(
    mnemonic: string,
    count: number,
    passphrase?: string,
  ): Promise<Wallet[]> {
    const wallets: Wallet[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const wallet = await this.createWalletFromMnemonic(mnemonic, i, passphrase);
        wallets.push(wallet);
      } catch {
        throw new CryptographyError(`Failed to create wallet for account ${i}`);
      }
    }

    return wallets;
  }
}
