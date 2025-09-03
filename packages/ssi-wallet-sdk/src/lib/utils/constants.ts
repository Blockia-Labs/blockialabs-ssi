import { WalletConfig } from '../types/index.js';

export const WALLET_DEFAULTS: WalletConfig = {
  derivationPath: "m/44'/60'/0'/0",
  entropySize: 256,
};

export const WALLET_LIMITS = {
  MAX_ACCOUNTS: 100,
  MIN_ACCOUNTS: 1,
} as const;

export const ENTROPY_SIZES = [128, 160, 192, 224, 256];
