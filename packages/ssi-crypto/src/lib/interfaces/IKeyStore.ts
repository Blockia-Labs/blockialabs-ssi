import { JWK } from '@blockialabs/ssi-types';

/**
 * Interface for managing a key store.
 * It provides methods to save, retrieve, delete, and list cryptographic keys.
 */
export interface IKeyStore {
  /**
   * Saves a cryptographic key in the key store with an associated key ID (kid).
   *
   * @param {string} kid - The key ID, used to identify the key in the key store.
   * @param {JWK} key - The cryptographic key to be stored in JSON Web Key (JWK) format.
   * @returns {Promise<void>} A promise that resolves when the key has been saved.
   */
  saveKey(kid: string, key: JWK): Promise<void>;

  /**
   * Retrieves a cryptographic key from the key store by its key ID (kid).
   *
   * @param {string} kid - The key ID of the key to be retrieved.
   * @returns {Promise<JWK | null>} A promise that resolves to the stored key in JWK format, or null if the key does not exist.
   */
  getKey(kid: string): Promise<JWK | null>;

  /**
   * Deletes a cryptographic key from the key store by its key ID (kid).
   *
   * @param {string} kid - The key ID of the key to be deleted.
   * @returns {Promise<void>} A promise that resolves when the key has been deleted.
   */
  deleteKey(kid: string): Promise<void>;

  /**
   * Lists all the key IDs currently stored in the key store.
   *
   * @returns {Promise<string[]>} A promise that resolves to an array of key IDs (kid).
   */
  listKeys(): Promise<string[]>;
}
