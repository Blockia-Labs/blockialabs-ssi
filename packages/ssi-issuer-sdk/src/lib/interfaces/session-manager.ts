import { CNonceState } from '../types/credential.js';
import { CredentialOfferSession } from '../types/session.js';

export interface NonceUpdate {
  newNonce: string;
  expiresIn?: number;
}

export interface ISessionManager {
  /**
   * Get a session by ID
   */
  get(id: string): Promise<CredentialOfferSession | null>;

  /**
   * Get a session by nonce and validate it
   */
  getByNonce(nonce: string): Promise<{
    session: CredentialOfferSession;
    nonceState: CNonceState;
  }>;

  /**
   * Create a new session or update an existing one
   */
  createOrUpdate(
    id: string,
    sessionData: Partial<CredentialOfferSession>,
  ): Promise<CredentialOfferSession>;

  /**
   * Rotate the current nonce with a new one
   */
  rotateNonce(currentNonce: CNonceState, update: NonceUpdate): Promise<CNonceState>;

  /**
   * Delete a session and its references
   */
  delete(id: string): Promise<boolean>;

  /**
   * Save a nonce state
   */
  saveNonce(nonce: string, nonceState: CNonceState): void;

  /**
   * Get all sessions
   */
  getAll(): Promise<CredentialOfferSession[]>;
}
