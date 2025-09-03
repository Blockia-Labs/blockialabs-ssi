import { InMemoryStorage, IStorageOptions } from '@blockialabs/ssi-storage';
import { CredentialOfferSession } from '../types.js';

/**
 * In-memory implementation of session storage
 */
export class SessionInMemoryStorage extends InMemoryStorage<CredentialOfferSession> {
  private sessions: Map<string, CredentialOfferSession> = new Map();
  private sessionRefs: Map<string, string> = new Map(); // Map reference keys to primary session IDs
  private cleanupInterval?: NodeJS.Timeout;
  private readonly expiryTime: number;

  /**
   * Create a new in-memory storage
   * @param options Configuration options
   */
  constructor(_options?: IStorageOptions) {
    super();
    this.expiryTime = (_options?.ttl || 300) * 1000; // Default 5 minutes in milliseconds

    this.startCleanupRoutine();
  }

  /**
   * Override set method to maintain session references
   */
  override async set(key: string, session: CredentialOfferSession): Promise<void> {
    // Check if the key is a reference to another session
    const existingId = this.sessionRefs.get(key);
    const sessionId = existingId || session.id || key;

    // Store the session by its primary ID
    await super.set(sessionId, session);
    this.sessions.set(sessionId, session);

    // Update the session references
    this.updateSessionRefs(session, sessionId);

    // Make sure timestamps are set
    if (!session.lastUpdatedAt) {
      session.lastUpdatedAt = Date.now();
    }
  }

  /**
   * Override get method to handle session references
   */
  override async get(key: string): Promise<CredentialOfferSession | null> {
    // Check if we have a reference mapping for this key
    const sessionId = this.sessionRefs.get(key);

    if (sessionId && sessionId !== key) {
      // If we found a reference, get the session by its ID
      const session = await super.get(sessionId);

      // Check expiration for non-deferred/issued sessions
      if (session && !this.isActiveIssuanceState(session.issuerState)) {
        const now = Date.now();
        if (now - session.lastUpdatedAt > this.expiryTime) {
          await this.delete(sessionId);
          return null;
        }
      }

      return session;
    }

    // Otherwise try to get directly
    const session = await super.get(key);

    // Check expiration for non-deferred/issued sessions
    if (session && !this.isActiveIssuanceState(session.issuerState)) {
      const now = Date.now();
      if (now - session.lastUpdatedAt > this.expiryTime) {
        await this.delete(key);
        return null;
      }
    }

    return session;
  }

  /**
   * Override delete method to clean up all references
   */
  override async delete(key: string): Promise<void> {
    const sessionId = this.sessionRefs.get(key) || key;
    const session = await this.get(sessionId);

    if (session) {
      // Remove all references to this session
      if (session.id) this.sessionRefs.delete(session.id);
      if (session.preAuthorizedCode) this.sessionRefs.delete(session.preAuthorizedCode);
      if (session.issuerState) this.sessionRefs.delete(session.issuerState);
      if (session.transactionId) this.sessionRefs.delete(session.transactionId);

      // Delete the session itself
      this.sessions.delete(sessionId);
      await super.delete(sessionId);
    }
  }

  /**
   * Update session references in the in-memory map
   */
  private updateSessionRefs(session: CredentialOfferSession, sessionId: string): void {
    // Store the primary ID reference
    if (session.id) {
      this.sessionRefs.set(session.id, sessionId);
    }

    // Store the preAuthorizedCode reference
    if (session.preAuthorizedCode && session.preAuthorizedCode !== session.id) {
      this.sessionRefs.set(session.preAuthorizedCode, sessionId);
    }

    // Store the issuerState reference
    if (session.issuerState && session.issuerState !== session.id) {
      this.sessionRefs.set(session.issuerState, sessionId);
    }

    // Store the transactionId reference
    if (session.transactionId && session.transactionId !== session.id) {
      this.sessionRefs.set(session.transactionId, sessionId);
    }
  }

  /**
   * Check if the session is in an active issuance state that should prevent it from expiring
   * Sessions in deferred, credential issued, or credential claimed states should not expire
   */
  private isActiveIssuanceState(issuerState: string | null | undefined): boolean {
    if (!issuerState) return false;

    // States that should not expire
    const activeStates = [
      'deferred', // Pending approval
      'credential_issued', // Credential has been issued but not yet claimed
      'credential_claimed', // Credential has been claimed
    ];

    return activeStates.includes(issuerState);
  }

  /**
   * Start automatic cleanup of expired sessions
   * @param intervalMs Interval in milliseconds
   */
  public startCleanupRoutine(intervalMs = 60000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => this.cleanup(), intervalMs);
  }

  /**
   * Stop the automatic cleanup routine
   */
  public stopCleanupRoutine(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Remove expired sessions
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      // Only expire sessions that are not in active issuance states
      if (
        !this.isActiveIssuanceState(session.issuerState) &&
        now - session.lastUpdatedAt > this.expiryTime
      ) {
        this.delete(id).catch(() => {
          // Ignore errors during cleanup
        });
      }
    }
  }
}
