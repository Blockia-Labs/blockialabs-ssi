import { ClaimWithMetadata } from './ClaimTypes.js';

/**
 * Response from token exchange endpoint
 */
export interface TokenResponse {
  /**
   * Access token for accessing protected resources
   */
  access_token: string;

  /**
   * OpenID Connect ID token containing user claims
   */
  id_token: string;

  /**
   * Refresh token for obtaining new access tokens
   */
  refresh_token: string;

  /**
   * Type of token issued, always "Bearer"
   */
  token_type: string;

  /**
   * Access token expiration time in seconds
   */
  expires_in: number;

  /**
   * Claims from the verified presentation
   */
  claims?: ClaimWithMetadata[];
}

/**
 * Error response from token endpoints
 */
export interface TokenErrorResponse {
  /**
   * OAuth 2.0 error code
   */
  error: string;

  /**
   * Human-readable error description
   */
  error_description?: string;
}

/**
 * Request to token exchange endpoint
 */
export interface TokenRequest {
  /**
   * Response code from successful verification
   */
  response_code: string;

  /**
   * Client ID requesting the token exchange
   */
  client_id: string;
}
