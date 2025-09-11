import { CNonceState } from '../types/index.js';
import { CredentialError, CredentialErrorCode } from '../types/errors.js';
import { CredentialOfferSession } from '../types/session.js';
import { ISessionManager, NonceUpdate } from '../interfaces/index.js';
import { IIssuerSessionStorage, IStorage } from '@blockialabs/ssi-storage';
import { v4 as uuidv4 } from 'uuid';

export class IssuerSessionManager implements ISessionManager {
  constructor(
    private readonly sessionStorage: IIssuerSessionStorage<CredentialOfferSession>,
    private readonly nonceStorage: IStorage<CNonceState>,
  ) {}

  saveNonce(nonce: string, nonceState: CNonceState) {
    return this.nonceStorage.set(nonce, nonceState);
  }

  async get(id: string): Promise<CredentialOfferSession | null> {
    return this.sessionStorage.get(id);
  }

  async getByNonce(nonce: string): Promise<{
    session: CredentialOfferSession;
    nonceState: CNonceState;
  }> {
    const nonceState = await this.nonceStorage.get(nonce);
    if (!nonceState) {
      throw new CredentialError(CredentialErrorCode.INVALID_NONCE, 'Invalid or expired nonce');
    }

    const sessionId = nonceState.preAuthorizedCode || nonceState.issuerState;
    if (!sessionId) {
      throw new CredentialError(CredentialErrorCode.INVALID_SESSION, 'No session identifier found');
    }

    const session = await this.get(sessionId);
    if (!session) {
      throw new CredentialError(CredentialErrorCode.INVALID_SESSION, 'No valid session found');
    }

    return { session, nonceState };
  }

  async createOrUpdate(
    id: string,
    sessionData: Partial<CredentialOfferSession>,
  ): Promise<CredentialOfferSession> {
    const existing = await this.get(id);
    const now = Date.now();

    // Start with the complete existing session data if available
    const session: CredentialOfferSession = {
      // Default values for new sessions
      id,
      createdAt: now,
      notificationStatus: 'created',
      notificationId: uuidv4(),
      preAuthorizedCode: id,
      transactionId: uuidv4(),

      // First spread all existing data if available
      ...(existing || {}),

      // Then update with the provided sessionData
      ...sessionData,

      // Always update lastUpdatedAt
      lastUpdatedAt: now,
    } as CredentialOfferSession;

    await this.saveSessionWithReferences(session);
    return session;
  }

  async rotateNonce(currentNonce: CNonceState, update: NonceUpdate): Promise<CNonceState> {
    if (!update.newNonce) {
      throw new CredentialError(CredentialErrorCode.INVALID_NONCE, 'New nonce value is required');
    }

    const newNonce: CNonceState = {
      cNonce: update.newNonce,
      createdAt: Date.now(),
      preAuthorizedCode: currentNonce.preAuthorizedCode,
      issuerState: currentNonce.issuerState,
      expiresIn: update.expiresIn,
    };

    await this.nonceStorage.set(update.newNonce, newNonce);
    await this.nonceStorage.delete(currentNonce.cNonce);

    return newNonce;
  }

  async delete(id: string): Promise<boolean> {
    const session = await this.get(id);
    if (!session) return false;

    // Let the storage implementation handle the deletion of references
    await this.sessionStorage.delete(id);
    return true;
  }

  async getAll(): Promise<CredentialOfferSession[]> {
    const keys = await this.sessionStorage.keys();
    const sessions = await Promise.all(keys.map((k: string) => this.sessionStorage.get(k)));
    return sessions.filter((s): s is CredentialOfferSession => !!s);
  }

  async getAllByIssuer(issuerId: string): Promise<CredentialOfferSession[]> {
    return await this.sessionStorage.getAllByIssuer(issuerId);
  }

  private async saveSessionWithReferences(session: CredentialOfferSession): Promise<void> {
    if (!session.id) {
      throw new CredentialError(CredentialErrorCode.INVALID_SESSION, 'Session must have an ID');
    }

    // Store the session only once - let the storage implementation handle references
    await this.sessionStorage.set(session.id, session);
  }
}
