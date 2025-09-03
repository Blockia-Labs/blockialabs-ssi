import { Key } from '../keys/Key.js';
import { KeyFormat, KeyType } from '@blockialabs/ssi-types';

/**
 * Interface for managing cryptographic keys.
 * It provides methods to create, rotate, export, and import keys.
 */
export interface IKeyManager {
  /**
   * Creates a new cryptographic key of the specified type.
   *
   * @param {KeyType} type - The type of key to create (e.g., Ed25519, Secp256k1).
   * @returns {Promise<Key>} A promise that resolves to the newly created key.
   */
  createKey(type: KeyType): Promise<Key>;

  /**
   * Rotates an existing cryptographic key by generating a new key and associating it with a new key ID (kid).
   *
   * @param {string} kid - The key ID of the key to be rotated.
   * @returns {Promise<Key>} A promise that resolves to the new rotated key.
   */
  rotateKey(kid: string): Promise<Key>;

  /**
   * Exports a cryptographic key in a specified format.
   *
   * @param {string} kid - The key ID of the key to be exported.
   * @param {KeyFormat} format - The format to export the key to (e.g., PEM, JWK).
   * @returns {Promise<string>} A promise that resolves to the key in the specified format as a string.
   */
  exportKey(kid: string, format: KeyFormat): Promise<string>;

  /**
   * Imports a cryptographic key from a specified string and format.
   *
   * @param {string} key - The key in string format (e.g., PEM, JWK) to be imported.
   * @param {KeyFormat} format - The format of the key being imported.
   * @returns {Promise<Key>} A promise that resolves to the imported cryptographic key.
   */
  importKey(key: string, format: KeyFormat): Promise<Key>;
}
