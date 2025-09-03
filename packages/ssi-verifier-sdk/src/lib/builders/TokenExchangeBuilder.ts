import { IStorage } from '@blockialabs/ssi-storage';
import { TokenManager } from '../services/TokenManager.js';
import { TokenResponse } from '../types/TokenTypes.js';
import { Transaction } from '../types/Authorization.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';
import { VerificationStatus } from '../types/PresentationResponse.js';

/**
 * Builder for token exchange operations
 */
export class TokenExchangeBuilder {
  private responseCode?: string;
  private clientId?: string;

  constructor(
    private readonly tokenManager: TokenManager,
    private readonly transactionStorage: IStorage<Transaction>,
    private readonly expectedClientId: string,
  ) {}

  /**
   * Set the response code to exchange
   */
  withResponseCode(responseCode: string): this {
    this.responseCode = responseCode;
    return this;
  }

  /**
   * Set the client ID for validation
   */
  withClientId(clientId: string): this {
    this.clientId = clientId;
    return this;
  }

  /**
   * Exchange response code for tokens
   */
  async exchange(): Promise<TokenResponse> {
    try {
      // Validate required inputs
      ValidationUtils.validateRequired(this.responseCode, 'responseCode');
      ValidationUtils.validateRequired(this.clientId, 'clientId');

      // Validate client ID
      if (this.clientId !== this.expectedClientId) {
        throw new Error('Invalid client ID');
      }

      // Find transaction by response code
      const transactions = await this.transactionStorage.keys();
      let transaction: Transaction | null = null;

      for (const key of transactions) {
        const tx = await this.transactionStorage.get(key);
        if (tx?.responseCode === this.responseCode) {
          transaction = tx;
          break;
        }
      }

      if (!transaction) {
        throw new Error('Invalid or expired response code');
      }

      // Validate response code hasn't expired
      const now = Date.now();
      const responseCodeMaxAge = 15 * 60 * 1000; // 15 minutes
      if (!transaction.verifiedAt || now - transaction.verifiedAt > responseCodeMaxAge) {
        transaction.status = VerificationStatus.EXPIRED;
        await this.transactionStorage.set(transaction.id, transaction);
        throw new Error('Response code has expired');
      }

      // Check if response code was already used
      if (transaction.responseCodeUsed) {
        throw new Error('Response code has already been used');
      }

      // Verify we have verification results with claims
      if (!transaction.claims) {
        throw new Error('No verified claims found for this response code');
      }

      // Generate tokens using TokenManager
      const tokens = await this.tokenManager.createTokens(
        transaction.id,
        transaction.claims,
        transaction.holderDid,
      );

      // Mark response code as used and update transaction
      transaction.responseCodeUsed = true;
      transaction.status = VerificationStatus.COMPLETED;
      // TODO delete complete transactions after some time
      await this.transactionStorage.set(transaction.id, transaction);

      // Return token response
      return {
        access_token: tokens.accessToken,
        id_token: tokens.idToken,
        refresh_token: tokens.refreshToken,
        token_type: 'Bearer',
        expires_in: tokens.expiresIn,
      };
    } catch (error) {
      throw new Error(
        `Token exchange failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
