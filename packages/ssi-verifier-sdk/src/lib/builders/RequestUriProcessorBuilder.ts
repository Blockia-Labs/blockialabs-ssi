import jwt from 'jsonwebtoken';
import { IStorage } from '@blockialabs/ssi-storage';
import { AuthorizationResponse, Transaction } from '../types/Authorization.js';

interface WalletMetadata {
  metadata?: Record<string, unknown>;
  nonce?: string;
}

/**
 * Result of processing a request URI
 */
export interface RequestUriProcessingResult {
  /**
   * The authorization response object
   */
  response: AuthorizationResponse;

  /**
   * JWT representation of the authorization response (if signing is enabled)
   */
  jwt?: string;

  /**
   * Error information if processing failed
   */
  error?: {
    code: string;
    description: string;
  };
}

/**
 * Builder for processing wallet requests to the request_uri endpoint
 */
export class RequestUriProcessorBuilder {
  private walletMetadata?: string;
  private walletNonce?: string;

  /**
   * Create a new RequestUriProcessorBuilder
   * @param transactionId The transaction ID from the request URI
   * @param transactionStorage Storage service for transaction data
   * @param options Configuration options
   */
  constructor(
    private readonly transactionId: string,
    private readonly transactionStorage: IStorage<Transaction>,
    private readonly options: {
      baseUrl: string;
      clientId: string;
      signingKey?: string;
      signingKeyId?: string;
    },
  ) {}

  /**
   * Set wallet metadata from the request
   */
  public withWalletMetadata(metadata: string): this {
    this.walletMetadata = metadata;
    return this;
  }

  /**
   * Set wallet nonce from the request
   */
  public withWalletNonce(nonce: string): this {
    this.walletNonce = nonce;
    return this;
  }

  /**
   * Process the request URI and build response
   * @returns Processing result with authorization response and JWT (if applicable)
   */
  public async build(): Promise<RequestUriProcessingResult> {
    try {
      // 1. Retrieve the transaction
      const transaction = await this.transactionStorage.get(this.transactionId);

      if (!transaction) {
        return {
          response: {} as AuthorizationResponse,
          error: {
            code: 'invalid_request',
            description: 'Transaction not found',
          },
        };
      }

      // 2. Check if transaction is expired
      if (Date.now() > transaction.expiresAt) {
        return {
          response: {} as AuthorizationResponse,
          error: {
            code: 'invalid_request',
            description: 'Transaction has expired',
          },
        };
      }

      // 3. Update transaction with wallet metadata if provided
      if (this.walletMetadata || this.walletNonce) {
        try {
          const walletInfo: WalletMetadata = transaction.walletMetadata || {};

          if (this.walletMetadata) {
            walletInfo.metadata = JSON.parse(this.walletMetadata);
          }

          if (this.walletNonce) {
            walletInfo.nonce = this.walletNonce;
          }

          await this.transactionStorage.set(this.transactionId, {
            ...transaction,
            walletMetadata: walletInfo,
          });
        } catch (error) {
          console.warn('Failed to update transaction with wallet metadata:', error);
          // Non-blocking error, continue processing
        }
      }

      // 4. Create response URI
      const responseUri = `${this.options.baseUrl}/response/${transaction.id}`;

      // 5. Build the authorization response
      const response: AuthorizationResponse = {
        id: transaction.id,
        clientId: this.options.clientId,
        responseUri,
        nonce: transaction.nonce,
        state: transaction.state,
        responseType: 'vp_token',
        responseMode: 'direct_post',
      };

      // 6. Add presentation definition or URI
      if (transaction.presentationDefinition.definition) {
        response.presentationDefinition = transaction.presentationDefinition.definition;
      } else if (transaction.presentationDefinition.uri) {
        response.presentationDefinitionUri = transaction.presentationDefinition.uri;
      }

      // 7. Create signed JWT if signing key is available
      if (this.options.signingKey && this.options.signingKeyId) {
        // get the payload from the response AuthorizationResponse
        const payload = {
          client_id: this.options.clientId,
          response_type: response.responseType,
          response_mode: response.responseMode,
          response_uri: responseUri,
          nonce: transaction.nonce,
          ...(transaction.state && { state: transaction.state }),
          ...(response.presentationDefinition && {
            presentation_definition: response.presentationDefinition,
          }),
          ...(response.presentationDefinitionUri && {
            presentation_definition_uri: response.presentationDefinitionUri,
          }),
        };

        const header = {
          alg: 'ES256', // Changed from RS256 to ES256 for ECDSA P-256
          typ: 'oauth-authz-req+jwt',
          kid: this.options.signingKeyId,
        };

        // Sign the JWT using ES256
        const token = jwt.sign(payload, this.options.signingKey, {
          algorithm: 'ES256',
          keyid: this.options.signingKeyId,
          header,
        });

        return {
          response,
          jwt: token,
        };
      }

      // 8. Return plain object response if no signing key available
      return {
        response,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing request URI:', errorMessage);

      return {
        response: {} as AuthorizationResponse,
        error: {
          code: 'server_error',
          description: errorMessage,
        },
      };
    }
  }
}
