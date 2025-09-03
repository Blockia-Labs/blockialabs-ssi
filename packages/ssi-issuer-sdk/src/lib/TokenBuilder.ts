import { base64url } from '@scure/base';
import { CredentialOfferSession } from './types/session.js';
import { ISessionManager } from './interfaces/index.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { TokenErrorResponse, TokenRequest, TokenResponse } from './types/token.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

/**
 * Builder for creating and signing access tokens
 */
export class TokenBuilder {
  private preAuthorizedCode?: string;
  private pinCode?: string;
  private clientId?: string;

  /**
   * Create a new token builder
   * @param sessionManager Session manager for accessing credential offer sessions
   * @param signatureProvider Provider for signing JWT tokens
   * @param options Token generation options
   */
  constructor(
    private readonly sessionManager: ISessionManager,
    private readonly signatureProvider: ISignatureProvider,
    private readonly options: {
      issuer: string;
      tokenExpiresIn?: number;
    },
  ) {}

  /**
   * Set pre-authorized code
   */
  public withPreAuthorizedCode(code: string): this {
    this.preAuthorizedCode = code;
    return this;
  }

  /**
   * Set PIN code for validation
   */
  public withPinCode(pin: string): this {
    this.pinCode = pin;
    return this;
  }

  /**
   * Set client ID for the token request
   */
  public withClientId(clientId: string): this {
    this.clientId = clientId;
    return this;
  }

  /**
   * Process token request and generate response
   */
  public async build(request?: TokenRequest): Promise<TokenResponse | TokenErrorResponse> {
    try {
      // Use provided request or build from builder properties
      const tokenRequest = request || this.buildTokenRequest();

      // Validate token request
      const { session, isValid, error } = await this.validateTokenRequest(tokenRequest);

      if (!isValid || error || !session) {
        return error!;
      }

      // Create access token
      const accessToken = await this.generateAccessToken(session);

      // Update session state
      await this.sessionManager.createOrUpdate(session.id, {
        lastUpdatedAt: Date.now(),
      });

      // Build token response
      return {
        access_token: accessToken,
        token_type: 'bearer',
        expires_in: this.options.tokenExpiresIn || 3600,
        authorization_details: session.credentialOffer?.credential_configuration_ids?.map((id) => ({
          type: 'openid_credential',
          credential_configuration_id: id,
        })),
      };
    } catch (error) {
      return {
        error: 'invalid_request',
        error_description: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build token request from builder properties
   */
  private buildTokenRequest(): TokenRequest {
    if (!this.preAuthorizedCode) {
      throw new Error('Pre-authorized code is required');
    }

    return {
      'grant_type': 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
      'pre-authorized_code': this.preAuthorizedCode,
      ...(this.pinCode && { tx_code: this.pinCode }),
      ...(this.clientId && { client_id: this.clientId }),
    };
  }

  /**
   * Validate the token request
   */
  private async validateTokenRequest(request: TokenRequest): Promise<{
    session?: CredentialOfferSession;
    isValid: boolean;
    error?: TokenErrorResponse;
  }> {
    // Check grant type
    if (request.grant_type !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
      return {
        isValid: false,
        error: {
          error: 'unsupported_grant_type',
          error_description: 'Only pre-authorized code flow is supported',
        },
      };
    }

    // Check for pre-authorized code
    if (!request['pre-authorized_code']) {
      return {
        isValid: false,
        error: {
          error: 'invalid_request',
          error_description: 'Pre-authorized code is required',
        },
      };
    }

    // Get session by pre-authorized code
    const session = await this.sessionManager.get(request['pre-authorized_code']);
    if (!session) {
      return {
        isValid: false,
        error: {
          error: 'invalid_grant',
          error_description: 'Invalid or expired pre-authorized code',
        },
      };
    }

    // Check if session is expired (assuming 10 minute expiry if not specified)
    const expiryDuration = 10 * 60 * 1000;
    const isExpired = Date.now() - session.createdAt > expiryDuration;
    if (isExpired) {
      return {
        isValid: false,
        error: {
          error: 'invalid_grant',
          error_description: 'Pre-authorized code has expired',
        },
      };
    }

    // Check if PIN is required and validate it
    const txCodeConfig =
      session.credentialOffer?.grants?.['urn:ietf:params:oauth:grant-type:pre-authorized_code']
        ?.tx_code;
    if (txCodeConfig) {
      // PIN is required
      if (!request.tx_code) {
        return {
          isValid: false,
          error: {
            error: 'invalid_request',
            error_description: 'PIN code is required',
          },
        };
      }

      // Validate PIN format if specified in offer
      if (txCodeConfig.input_mode === 'numeric') {
        const numericRegex = new RegExp(`^\\d{${txCodeConfig.length}}$`);
        if (!numericRegex.test(request.tx_code)) {
          return {
            isValid: false,
            error: {
              error: 'invalid_grant',
              error_description: `PIN must be ${txCodeConfig.length} digits`,
            },
          };
        }
      }

      // Validate PIN value
      if (session.pin && request.tx_code !== session.pin) {
        return {
          isValid: false,
          error: {
            error: 'invalid_grant',
            error_description: 'Invalid PIN code',
          },
        };
      }
    } else if (request.tx_code) {
      // PIN is not required but provided
      return {
        isValid: false,
        error: {
          error: 'invalid_request',
          error_description: 'PIN code not expected for this offer',
        },
      };
    }

    return { session, isValid: true };
  }

  /**
   * Generate a signed access token
   */
  private async generateAccessToken(session: CredentialOfferSession): Promise<string> {
    const issuerId = session.issuerId;
    if (!issuerId) {
      throw new Error('issuerId is required to sign the token');
    }
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.options.tokenExpiresIn || 3600;

    const headerObj = {
      alg: 'ES256',
      typ: 'JWT',
    };

    const payloadObj = {
      iss: this.options.issuer,
      iat: now,
      exp: now + expiresIn,
      sub: session.preAuthorizedCode,
      token_type: 'Bearer',
      ...(this.clientId && { aud: this.clientId }),
    };

    const headerBytes = utf8ToBytes(JSON.stringify(headerObj));
    const payloadBytes = utf8ToBytes(JSON.stringify(payloadObj));

    const headerStr = base64url.encode(headerBytes);
    const payloadStr = base64url.encode(payloadBytes);
    const dataToSign = `${headerStr}.${payloadStr}`;

    // Sign using the signatureProvider - if using KmsProvider, issuerId will be used as a reference
    // to the key in AWS KMS, not as the actual private key
    const signatureBase64url = await this.signatureProvider.sign(dataToSign, issuerId);

    return `${dataToSign}.${signatureBase64url}`;
  }
}
