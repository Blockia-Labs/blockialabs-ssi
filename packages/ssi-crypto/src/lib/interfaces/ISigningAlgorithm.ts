import { Key } from '../keys/Key.js';
import { KeyType, Signature } from '@blockialabs/ssi-types';

/**
 * Interface for cryptographic algorithms, providing methods for key generation, signing, verification, encryption, and decryption.
 */
export interface ISigningAlgorithm {
  /**
   * Generates a new cryptographic key pair of the specified type.
   * @param type The type of key to generate.
   * @returns A promise that resolves to a new Key object.
   */
  generateKeyPair(type: KeyType): Promise<Key>;

  /**
   * Generates a new cryptographic private key of the specified type.
   * @param type The type of key to generate.
   * @returns A promise that resolves to a new private Key object containing the private key, and type.
   */
  generatePrivateKey(type: KeyType): Promise<Uint8Array>;

  /**
   * Derives the public key from the provided private key.
   * @param privateKey The private key as a Uint8Array.
   * @returns A promise that resolves to the public key as a Uint8Array.
   */
  derivePublicKey(privateKey: Uint8Array): Promise<Uint8Array>;

  /**
   * Signs a message using the provided key.
   * @param message The message to sign (as a Uint8Array).
   * @param key The key to use for signing.
   * @returns A promise that resolves to the signature (as a Uint8Array).
   */
  sign(message: Uint8Array | string, key: Key): Promise<Uint8Array>;

  /**
   * Verifies a signature against a message using the provided key.
   * @param signature The signature to verify (as a Uint8Array).
   * @param message The message that was signed (as a Uint8Array).
   * @param key The key to use for verification.
   * @returns A promise that resolves to true if the signature is valid, false otherwise.
   */
  verify(signature: Signature, message: Uint8Array | string, key: Key): Promise<boolean>;

  /**
   * Encrypts a message using the provided key.
   * @param message The message to encrypt (as a Uint8Array).
   * @param key The key to use for encryption.
   * @returns A promise that resolves to the ciphertext (as a Uint8Array).
   */
  encrypt(message: Uint8Array, key: Key): Promise<Uint8Array>;

  /**
   * Decrypts a ciphertext using the provided key.
   * @param ciphertext The ciphertext to decrypt (as a Uint8Array).
   * @param key The key to use for decryption.
   * @returns A promise that resolves to the decrypted message (as a Uint8Array).
   */
  decrypt(ciphertext: Uint8Array, key: Key): Promise<Uint8Array>;
}
