import { TokenManager } from '../services/TokenManager.js';
import { TokenResponse } from '../types/TokenTypes.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';

/**
 * Builder for token refresh operations
 */
export class TokenRefreshBuilder {
  private refreshToken?: string;
  private clientId?: string;

  constructor(
    private readonly tokenManager: TokenManager,
    private readonly expectedClientId: string,
  ) {}

  /**
   * Set the refresh token
   */
  withRefreshToken(refreshToken: string): this {
    this.refreshToken = refreshToken;
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
   * Refresh tokens using the refresh token
   */
  async refresh(): Promise<TokenResponse> {
    try {
      // Validate required inputs
      const validatedRefreshToken = ValidationUtils.validateRequired(
        this.refreshToken,
        'refreshToken',
      );
      ValidationUtils.validateRequired(this.clientId, 'clientId');

      // Validate client ID
      if (this.clientId !== this.expectedClientId) {
        throw new Error('Invalid client ID');
      }

      // Validate refresh token and get associated data
      const tokenRecord = await this.tokenManager.validateRefreshToken(validatedRefreshToken);
      if (!tokenRecord) {
        throw new Error('Invalid or expired refresh token');
      }

      // Extract holder DID from the original sub field if present
      let holderDid: string | undefined;
      if (tokenRecord.transactionId && tokenRecord.sub) {
        holderDid = tokenRecord.sub;
      }

      // Generate new tokens using TokenManager
      const tokens = await this.tokenManager.createTokens(
        tokenRecord.transactionId,
        tokenRecord.claims,
        holderDid,
      );

      // Mark old refresh token as revoked
      await this.tokenManager.revokeToken(tokenRecord.refreshTokenId);

      // Return token response with new tokens
      return {
        access_token: tokens.accessToken,
        id_token: tokens.idToken,
        refresh_token: tokens.refreshToken,
        token_type: 'Bearer',
        expires_in: tokens.expiresIn,
      };
    } catch (error) {
      throw new Error(
        `Token refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
