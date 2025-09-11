import { ApprovalBuilder } from './ApprovalBuilder.js';
import { CredentialProcessor, ICompleteOptions, ICredential } from '@blockialabs/ssi-credentials';
import { IRevocationManager } from '@blockialabs/ssi-revocation';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import {
  IIssuerKeyStore,
  IProofValidator,
  ISessionManager,
  IssuerKeyPair,
} from './interfaces/index.js';
import { OfferBuilder } from './OfferBuilder.js';
import { RejectBuilder, RejectOptions } from './RejectBuilder.js';
import { RequestBuilder } from './RequestBuilder.js';
import { RevocationBuilder } from './RevocationBuilder.js';
import { TokenBuilder } from './TokenBuilder.js';
import {
  CNonceState,
  CredentialOfferOptions,
  CredentialOfferSession,
  CredentialRequest,
  CredentialResponse,
  DeferredCredentialErrorCode,
  DeferredCredentialRequest,
  DeferredCredentialResponse,
  IssuerConfig,
  IssuerOptions,
  IssueStatus,
  NotificationRequest,
  TokenErrorResponse,
  TokenRequest,
  TokenResponse,
} from './types.js';

/**
 * Main credential issuer class
 */
export class CredentialIssuer {
  private readonly sessionManager: ISessionManager;
  private readonly credentialProcessor: CredentialProcessor;
  private readonly proofValidators: Map<string, IProofValidator>;
  private readonly revocationManager?: IRevocationManager;
  private readonly keyStore?: IIssuerKeyStore;
  private readonly signatureProvider: ISignatureProvider;

  /**
   * Create a new credential issuer
   * @param config Issuer configuration
   * @param options Additional options for the issuer
   */
  constructor(
    private readonly config: IssuerConfig,
    options: IssuerOptions,
  ) {
    this.validateConfig(config);
    this.sessionManager = options.sessionManager;
    this.credentialProcessor = options.credentialProcessor;
    this.proofValidators = options.proofValidators;
    this.revocationManager = options.revocationNeeded;
    this.keyStore = options.keyStore;
    this.signatureProvider = options.signatureProvider;
  }

  /**
   * Generates a fresh c_nonce value for JWT proof validation
   * Implementation of the OpenID4VCI Nonce Endpoint (Section 7)
   *
   * @param options Optional configuration for nonce generation
   * @returns Promise with the nonce response containing c_nonce
   */
  public async generateNonce(options?: {
    preAuthorizedCode: string;
    issuerState?: string;
    expiresIn?: number;
  }): Promise<{ c_nonce: string }> {
    // Generate a secure, unpredictable nonce value using Web Crypto API
    const buffer = new Uint8Array(16); // 16 bytes = 128 bits
    crypto.getRandomValues(buffer);
    const c_nonce = Buffer.from(buffer).toString('base64');

    // Register the nonce in our state management system
    await this.registerNonce(c_nonce, options);

    // Return the response format as specified in OpenID4VCI Section 7.2
    return { c_nonce };
  }

  /**
   * Registers a nonce that can be used for JWT validation
   * @param nonce The nonce value to register
   * @param options Options including reference to session and expiration
   * @returns The registered nonce state
   */
  public async registerNonce(
    nonce: string,
    options?: {
      preAuthorizedCode: string;
      issuerState?: string;
      expiresIn?: number;
    },
  ): Promise<CNonceState> {
    if (!nonce) {
      throw new Error('Nonce value is required');
    }

    const nonceState: CNonceState = {
      cNonce: nonce,
      createdAt: Date.now(),
      preAuthorizedCode: options?.preAuthorizedCode,
      issuerState: options?.issuerState,
      expiresIn: options?.expiresIn || 3600, // Default 1 hour expiry
    };

    // Store the nonce state
    await this.sessionManager.saveNonce(nonce, nonceState);
    return nonceState;
  }

  /**
   * Extracts the nonce from a JWT without verifying it
   * @param jwt The JWT to extract from
   * @returns The extracted nonce
   * @throws Error if the JWT is malformed or missing nonce
   */
  extractNonceFromJwt(jwt: string): string {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format - expected 3 parts');
    }

    let payload;
    try {
      const payloadB64 = parts[1];
      payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    } catch (error) {
      console.error('🚀 ~ CredentialIssuer ~ extractNonceFromJwt ~ error:', error);
      throw new Error('Failed to parse JWT payload');
    }

    if (!payload.nonce || typeof payload.nonce !== 'string') {
      throw new Error('JWT payload must contain a nonce string');
    }

    return payload.nonce;
  }

  /**
   * Create a credential offer builder
   * @param options Options for the credential offer
   * @returns An OfferBuilder instance
   */
  public createCredentialOfferBuilder(options: CredentialOfferOptions = {}): OfferBuilder {
    return new OfferBuilder(this.config, this.sessionManager, options);
  }

  /**
   * Get a session by ID
   * @param id Session ID or pre-authorized code
   */
  public async getSession(id: string): Promise<CredentialOfferSession | null> {
    return this.sessionManager.get(id);
  }

  /**
   * Delete a session by ID
   * @param id Session ID or pre-authorized code
   */
  public async deleteSession(id: string): Promise<boolean> {
    return this.sessionManager.delete(id);
  }

  /**
   * Get all credential offer sessions
   */
  public async getAllSessions(): Promise<CredentialOfferSession[]> {
    return this.sessionManager.getAll();
  }

  /**
   * Process notification from wallet
   * @param preAuthorizedCode Pre-authorized code
   * @param issuerState Issuer state for auth code flow
   * @param notification Notification from wallet
   */
  public async processNotification(
    preAuthorizedCode?: string,
    issuerState?: string,
    notification?: NotificationRequest,
  ): Promise<CredentialOfferSession | Error> {
    if (!notification) {
      return new Error('Missing notification data');
    }

    const sessionKey = preAuthorizedCode || issuerState;
    if (!sessionKey) {
      return new Error('Missing session identifier');
    }

    try {
      // Get existing session
      const existingSession = await this.sessionManager.get(sessionKey);
      if (!existingSession) {
        return new Error('Session not found');
      }

      if (notification.notification_id !== existingSession.notificationId) {
        return new Error('Invalid notification ID');
      }

      // Determine new status based on notification event
      const notificationStatus = this.getStatusFromEvent(notification.event);

      // Update session using session manager
      return await this.sessionManager.createOrUpdate(existingSession.id, {
        notificationStatus,
        notification,
        error: notification.event === 'credential_failure' ? notification.error : undefined,
      });
    } catch (error) {
      return error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }

  /**
   * Get session status from notification event
   */
  private getStatusFromEvent(event: string): string {
    switch (event) {
      case 'credential_accepted':
      case 'credential_deleted':
        return 'notification_received';
      case 'credential_failure':
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Saves a session to storage
   * @param id Session ID
   * @param session Session data to save
   * @returns Promise that resolves when save is complete
   */
  public async saveSession(id: string, session: CredentialOfferSession): Promise<void> {
    if (!id || !session) {
      throw new Error('Session ID and data are required');
    }

    // Update timestamps if not set
    if (!session.createdAt) {
      session.createdAt = Date.now();
    }

    await this.sessionManager.createOrUpdate(id, session);
  }

  /**
   * Initiates credential issuance flow using builder pattern
   * @param opts Options for the credential request
   */
  public createCredentialRequestBuilder(opts: { responseCNonce: string }): RequestBuilder {
    return new RequestBuilder(
      this.config,
      this.sessionManager,
      this.credentialProcessor,
      this.proofValidators,
      opts,
    );
  }

  /**
   * Create a token builder for more granular control
   * @param options Additional token generation options
   * @returns TokenBuilder instance
   */
  public createTokenBuilder(options?: { tokenExpiresIn?: number }): TokenBuilder {
    return new TokenBuilder(this.sessionManager, this.signatureProvider, {
      issuer: this.config.credential_issuer,
      tokenExpiresIn: options?.tokenExpiresIn || 3600,
    });
  }

  /**
   * Process a token request using the pre-authorized code flow
   * @param request The token request
   * @returns Token response or error
   */
  public async processTokenRequest(
    request: TokenRequest,
    options?: { tokenExpiresIn?: number },
  ): Promise<TokenResponse | TokenErrorResponse> {
    try {
      const tokenBuilder = this.createTokenBuilder(options);
      return await tokenBuilder.build(request);
    } catch (error) {
      return {
        error: 'invalid_request',
        error_description: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Issues a verifiable credential based on the provided request
   * @param opts Credential issuance options
   * @returns Credential response with the issued credential
   */
  public async submitCredentialRequest(opts: {
    credentialRequest: CredentialRequest;
    credential: ICredential;
    responseCNonce: string;
    newCNonce?: string;
    cNonceExpiresIn?: number;
  }): Promise<CredentialResponse> {
    return this.createCredentialRequestBuilder({ responseCNonce: opts.responseCNonce })
      .withCredentialRequest(opts.credentialRequest)
      .withCredential(opts.credential)
      .withNewNonce(opts.newCNonce, opts.cNonceExpiresIn)
      .build();
  }

  /**
   * Check the deferred credential request and retrieve the credential if ready
   * Updates session state and invalidates transaction ID after successful retrieval or rejection
   * @param request Deferred credential request containing transaction ID
   * @returns Deferred credential response with status or credential
   */
  public async checkCredentialRequestStatus(
    request: DeferredCredentialRequest,
  ): Promise<DeferredCredentialResponse> {
    if (!request.transaction_id) {
      return {
        error: DeferredCredentialErrorCode.INVALID_TRANSACTION_ID,
        error_description: 'Transaction ID is required',
      };
    }

    let session;
    try {
      session = await this.sessionManager.get(request.transaction_id);
      if (!session?.transactionId) {
        return {
          error: DeferredCredentialErrorCode.INVALID_TRANSACTION_ID,
          error_description: 'Invalid or expired transaction ID',
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        error: DeferredCredentialErrorCode.ISSUANCE_FAILED,
        error_description: `Failed to retrieve session : ${message}`,
      };
    }

    switch (session.issuerState) {
      case IssueStatus.DEFERRED:
        return {
          error: DeferredCredentialErrorCode.ISSUANCE_PENDING,
          interval: 5,
        };

      case IssueStatus.CREDENTIAL_ISSUED:
        if (!session.credentialResponse) {
          await this.sessionManager.createOrUpdate(session.id, {
            issuerState: IssueStatus.DEFERRED,
          });
          return {
            error: DeferredCredentialErrorCode.ISSUANCE_PENDING,
            interval: 5,
          };
        }

        await this.sessionManager.createOrUpdate(session.id, {
          issuerState: IssueStatus.CREDENTIAL_CLAIMED,
          transactionId: undefined,
          credentialResponse: undefined,
        });

        return {
          credentials: [
            {
              credential: session.credentialResponse,
            },
          ],
          notification_id: session.notificationId,
        };

      case IssueStatus.REJECTED:
        return {
          error: DeferredCredentialErrorCode.ISSUANCE_REJECTED,
          error_description: session.error || 'Credential request rejected',
        };

      case IssueStatus.CREDENTIAL_CLAIMED:
        return {
          error: DeferredCredentialErrorCode.INVALID_TRANSACTION_ID,
          error_description: 'Credential already claimed',
        };

      default:
        return {
          error: DeferredCredentialErrorCode.ISSUANCE_FAILED,
          error_description: 'Invalid issuance state',
        };
    }
  }

  /**
   * Create approval builder for completing deferred issuance
   * @param transactionId Transaction ID of the deferred request
   */
  public createApprovalBuilder(transactionId: string): ApprovalBuilder {
    return new ApprovalBuilder(transactionId, this.sessionManager, this.credentialProcessor);
  }

  /**
   * Approve and complete credential issuance with proof
   * Convenience method using ApprovalBuilder
   */
  public async approveCredentialRequest(
    transactionId: string,
    options: ICompleteOptions,
  ): Promise<DeferredCredentialResponse> {
    const builder = this.createApprovalBuilder(transactionId);
    builder.withCompleteOptions(options);
    return builder.build();
  }

  /**
   * Create reject builder for rejecting deferred issuance
   * @param transactionId Transaction ID of the deferred request
   */
  public createRejectBuilder(transactionId: string): RejectBuilder {
    return new RejectBuilder(transactionId, this.sessionManager);
  }

  /**
   * Reject a pending credential request
   * Convenience method using RejectBuilder
   * @param transactionId Transaction ID of the deferred request
   * @param options Rejection options
   */
  public async rejectCredentialRequest(
    transactionId: string,
    options: RejectOptions = {},
  ): Promise<DeferredCredentialResponse> {
    const builder = this.createRejectBuilder(transactionId);
    if (options.description) {
      builder.withDescription(options.description);
    }
    if (options.code) {
      builder.withErrorCode(options.code);
    }
    return builder.build();
  }

  /**
   * Create a revocation builder to revoke a credential
   * @param credentialId ID of the credential to revoke
   * @param revokerDID DID of the entity revoking the credential
   * @returns A RevocationBuilder instance
   * @throws Error if revocation service is not configured
   */
  public createRevocationBuilder(credentialId: string, revokerDID: string): RevocationBuilder {
    if (!this.revocationManager) {
      throw new Error('Revocation service not configured');
    }

    return new RevocationBuilder(credentialId, revokerDID, this.revocationManager);
  }

  /**
   * Get the issuer configuration
   * @returns The current issuer configuration
   */
  public getConfig(): IssuerConfig {
    return this.config;
  }

  /**
   * Generate a new key pair for the issuer
   * @param issuerId The ID of the issuer
   * @param algorithm The algorithm to use for key generation
   * @returns The generated key pair
   */
  public generateKeyPair(issuerId: string): Promise<IssuerKeyPair> {
    return this.getKeyStore().generateKeyPair(issuerId);
  }

  /**
   * Get the public key for the issuer
   * @param issuerId The ID of the issuer
   * @returns The public key as a string
   */
  public getPublicKey(issuerId: string): Promise<string> {
    return this.getKeyStore().getPublicKey(issuerId);
  }

  /**
   * Sign data with the issuer's private key
   * @param issuerId The ID of the issuer
   * @param data The data to sign
   * @returns The signed data as a string
   */
  public async sign(data: string, issuerId: string): Promise<string> {
    return this.getKeyStore().sign(data, issuerId);
  }

  /**
   * Delete the key pair for an issuer
   * @param issuerId The ID of the issuer
   */
  public deleteKey(issuerId: string): Promise<void> {
    return this.getKeyStore().deleteKey(issuerId);
  }

  /**
   * Check if a key exists for the given issuer ID
   * @param issuerId The ID of the issuer
   * @returns True if the key exists, false otherwise
   */
  public hasKey(issuerId: string): Promise<boolean> {
    return this.getKeyStore().hasKey(issuerId);
  }

  /**
   * Validate the issuer configuration
   */
  private validateConfig(config: IssuerConfig): void {
    if (!config.credential_issuer) {
      throw new Error('Issuer identifier (credential_issuer) is required');
    }

    if (
      !config.credential_configurations_supported ||
      Object.keys(config.credential_configurations_supported).length === 0
    ) {
      throw new Error('At least one credential configuration must be defined');
    }
  }

  private getKeyStore(): IIssuerKeyStore {
    if (!this.keyStore) {
      throw new Error('Key store is not configured');
    }
    return this.keyStore;
  }
}
