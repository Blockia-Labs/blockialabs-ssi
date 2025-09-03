import { HDKey } from '@scure/bip32';
import { ValidationError, CryptographyError } from '../../utils/errors.js';
import { CryptoUtils } from '../crypto/crypto-utils.js';
import { JsonWebKey } from '../../types/index.js';
import { bytesToHex } from '@noble/hashes/utils.js';

/**
 * SSI-focused Wallet implementation for Verifiable Credentials and DID operations.
 */
export class Wallet {
  constructor(
    public readonly mnemonic: string,
    public readonly privateKeyHex: string,
    public readonly publicKeyHex: string,
    public readonly keyId: string, // DID key identifier
    public readonly accountIndex: number,
    private readonly hdKey: HDKey,
  ) {}

  static generateMnemonic(entropySize?: number): string {
    return CryptoUtils.generateMnemonic(entropySize);
  }

  static validateMnemonic(mnemonic: string): boolean {
    return CryptoUtils.validateMnemonic(mnemonic);
  }

  static async fromMnemonic(
    mnemonic: string,
    derivationPath: string,
    accountIndex: number,
    passphrase?: string,
  ): Promise<Wallet> {
    if (!CryptoUtils.validateMnemonic(mnemonic)) {
      throw new ValidationError('Invalid mnemonic');
    }

    try {
      const seed = await CryptoUtils.mnemonicToSeed(mnemonic, passphrase);
      const masterKey = CryptoUtils.createMasterKey(seed);
      const childKey = CryptoUtils.deriveChildKey(masterKey, derivationPath, accountIndex);

      const privateKey = childKey.privateKey;
      const publicKey = childKey.publicKey;

      if (!privateKey || !publicKey) {
        throw new CryptographyError('Key generation incomplete');
      }

      const privateKeyHex = bytesToHex(privateKey);
      const publicKeyHex = bytesToHex(publicKey);

      // Generate DID-compatible key identifier
      const keyId = CryptoUtils.generateKeyId(publicKey);

      return new Wallet(mnemonic, privateKeyHex, publicKeyHex, keyId, accountIndex, childKey);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof CryptographyError) {
        throw error;
      }
      throw new CryptographyError('Wallet creation failed');
    }
  }

  /**
   * Get private key as Uint8Array (safe accessor)
   */
  private getPrivateKey(): Uint8Array {
    const privateKey = this.hdKey.privateKey;
    if (!privateKey) {
      throw new CryptographyError('Private key not available');
    }
    return privateKey;
  }

  /**
   * Get public key as Uint8Array (safe accessor)
   */
  private getPublicKey(): Uint8Array {
    const publicKey = this.hdKey.publicKey;
    if (!publicKey) {
      throw new CryptographyError('Public key not available');
    }
    return publicKey;
  }

  /**
   * Sign a message for VC/VP operations
   */
  async signMessage(message: string): Promise<string> {
    try {
      return CryptoUtils.signMessage(this.getPrivateKey(), message);
    } catch {
      throw new CryptographyError('Message signing failed');
    }
  }

  /**
   * Verify a signature against this wallet's public key
   */
  async verifyMessage(message: string, signatureBase64url: string): Promise<boolean> {
    try {
      return CryptoUtils.verifyMessage(this.getPublicKey(), message, signatureBase64url);
    } catch {
      return false;
    }
  }

  /**
   * Generate a JWK representation of the public key for DID documents
   */
  getPublicKeyJWK(): JsonWebKey {
    return CryptoUtils.publicKeyToJWK(this.getPublicKey());
  }

  /**
   * Generate a DID:key identifier for this wallet
   */
  getDidKey(): string {
    return CryptoUtils.publicKeyToDidKey(this.getPublicKey());
  }

  /**
   * Create a key proof for VC issuance (OpenID4VCI)
   */
  async createKeyProof(audience: string, nonce?: string): Promise<string> {
    return CryptoUtils.createJwtKeyProof(
      this.getPrivateKey(),
      this.getPublicKey(),
      audience,
      nonce,
    );
  }
}
