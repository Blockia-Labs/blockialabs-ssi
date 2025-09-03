import { bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { CryptographyError, StorageError } from '../../utils/errors.js';
import { gcm } from '@noble/ciphers/aes.js';
import { ISecureStorage, IEncryptedData } from '../../types/index.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

export class SecureWalletStorage {
  private readonly ENCRYPTED_DATA_KEY = 'wallet.encrypted';
  private readonly SALT_SIZE = 32;
  private readonly NONCE_SIZE = 12;
  private readonly KEY_ITERATIONS = 210000;
  private readonly KEY_LENGTH = 32;

  constructor(private readonly storage: ISecureStorage) {}

  async exists(): Promise<boolean> {
    try {
      return await this.storage.hasItem(this.ENCRYPTED_DATA_KEY);
    } catch {
      throw new StorageError('Failed to check wallet existence');
    }
  }

  async save(mnemonic: string, passcode: string): Promise<void> {
    try {
      const salt = this.generateSalt();
      const nonce = this.generateNonce();
      const encryptionKey = await this.deriveEncryptionKey(passcode, salt);
      const encryptedMnemonic = this.encryptMnemonic(mnemonic, encryptionKey, nonce);

      const encryptedData: IEncryptedData = {
        encrypted: bytesToHex(encryptedMnemonic),
        salt: bytesToHex(salt),
        nonce: bytesToHex(nonce),
        version: 1,
        iterations: this.KEY_ITERATIONS,
      };

      await this.storage.setItem(this.ENCRYPTED_DATA_KEY, JSON.stringify(encryptedData));
    } catch (error) {
      if (error instanceof CryptographyError) {
        throw error;
      }
      throw new StorageError('Failed to save wallet');
    }
  }

  async load(passcode: string): Promise<string> {
    try {
      const encryptedDataStr = await this.storage.getItem(this.ENCRYPTED_DATA_KEY);
      if (!encryptedDataStr) {
        throw new StorageError('Wallet not found');
      }

      const encryptedData = JSON.parse(encryptedDataStr) as IEncryptedData;
      const saltBytes = hexToBytes(encryptedData.salt);
      const nonceBytes = hexToBytes(encryptedData.nonce);
      const encryptedBytes = hexToBytes(encryptedData.encrypted);

      const encryptionKey = await this.deriveEncryptionKey(passcode, saltBytes);
      return this.decryptMnemonic(encryptedBytes, encryptionKey, nonceBytes);
    } catch (error) {
      if (error instanceof CryptographyError || error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to load wallet');
    }
  }

  async remove(): Promise<void> {
    try {
      await this.storage.removeItem(this.ENCRYPTED_DATA_KEY);
    } catch {
      throw new StorageError('Failed to remove wallet');
    }
  }

  private generateSalt(): Uint8Array {
    try {
      return randomBytes(this.SALT_SIZE);
    } catch {
      throw new CryptographyError('Salt generation failed');
    }
  }

  private generateNonce(): Uint8Array {
    try {
      return randomBytes(this.NONCE_SIZE);
    } catch {
      throw new CryptographyError('Nonce generation failed');
    }
  }

  private async deriveEncryptionKey(passcode: string, salt: Uint8Array): Promise<Uint8Array> {
    try {
      const passwordBytes = utf8ToBytes(passcode);
      return pbkdf2(sha256, passwordBytes, salt, {
        c: this.KEY_ITERATIONS,
        dkLen: this.KEY_LENGTH,
      });
    } catch {
      throw new CryptographyError('Key derivation failed');
    }
  }

  private encryptMnemonic(mnemonic: string, key: Uint8Array, nonce: Uint8Array): Uint8Array {
    try {
      const mnemonicBytes = utf8ToBytes(mnemonic);
      const cipher = gcm(key, nonce);
      return cipher.encrypt(mnemonicBytes);
    } catch {
      throw new CryptographyError('Encryption failed');
    }
  }

  private decryptMnemonic(encryptedData: Uint8Array, key: Uint8Array, nonce: Uint8Array): string {
    try {
      const cipher = gcm(key, nonce);
      const decryptedBytes = cipher.decrypt(encryptedData);
      return new TextDecoder().decode(decryptedBytes);
    } catch {
      throw new CryptographyError('Decryption failed');
    }
  }
}
