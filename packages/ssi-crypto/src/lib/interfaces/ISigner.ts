import { Key } from '../keys/Key.js';
import { Signature, KeyType } from '@blockialabs/ssi-types';

/**
 * Interface for signing and verifying messages using cryptographic keys.
 * It provides methods to create keys, sign messages, and verify signatures.
 */
export interface ISigner {
  /**
   * Creates a new cryptographic key of the specified type.
   *
   * @param {KeyType} type - The type of key to be created (e.g., Ed25519, Secp256k1).
   * @returns {Promise<Key>} A promise that resolves to the generated Key object.
   */
  createKey(type: KeyType): Promise<Key>;

  /**
   * Signs a given message with a specified key.
   *
   * @param {Uint8Array} message - The message to be signed.
   * @param {Key} key - The key used for signing the message.
   * @returns {Promise<Uint8Array>} A promise that resolves to the signed message (signature).
   */
  sign(message: Uint8Array | string, key: Key): Promise<Uint8Array>;

  /**
   * Verifies that a given signature is valid for a specific message using a specified key.
   *
   * @param {Uint8Array} signature - The signature to verify.
   * @param {Uint8Array} message - The original message that was signed.
   * @param {Key} key - The key used to verify the signature.
   * @returns {Promise<boolean>} A promise that resolves to true if the signature is valid, false otherwise.
   */
  verify(signature: Signature, message: Uint8Array | string, key: Key): Promise<boolean>;
}
