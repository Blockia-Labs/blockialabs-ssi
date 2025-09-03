export interface WalletConfig {
  readonly derivationPath: string;
  readonly entropySize: number;
}

export interface IEncryptedData {
  encrypted: string;
  salt: string;
  nonce: string;
  version: number;
  iterations: number;
}
