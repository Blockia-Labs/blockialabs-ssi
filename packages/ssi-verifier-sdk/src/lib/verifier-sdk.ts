import { AuthorizationRequest, AuthorizationResponse, Transaction } from './types/Authorization.js';
import { AuthorizationRequestBuilder } from './builders/AuthorizationRequestBuilder.js';
import { CredentialProcessor } from '@blockialabs/ssi-credentials';
import { IDIDResolver } from '@blockialabs/ssi-did';
import { InMemoryStorage, IStorage } from '@blockialabs/ssi-storage';
import { PresentationRequestBuilder } from './builders/PresentationRequestBuilder.js';
import { PresentationResponse, VerificationOptions } from './types/PresentationResponse.js';
import { PresentationVerificationBuilder } from './builders/PresentationVerificationBuilder.js';
import { QRCodeOptions } from 'qrcode';
import { RequestUriProcessorBuilder } from './builders/RequestUriProcessorBuilder.js';
import { TokenExchangeBuilder } from './builders/TokenExchangeBuilder.js';
import { TokenManager, TokenRecord } from './services/TokenManager.js';
import { TokenRefreshBuilder } from './builders/TokenRefreshBuilder.js';
import { TokenResponse } from './types/TokenTypes.js';
import { ValidationUtils } from './utils/ValidationUtils.js';
import {
  FormatDefinition,
  SubmissionRequirement,
  PresentationDefinition,
} from './types/PresentationDefinition.js';

/**
 * Configuration options for the VerifierSDK
 */
export interface VerifierSDKOptions {
  baseUrl: string;
  clientId: string;
  credentialProcessor: CredentialProcessor;
  holderDidResolver: IDIDResolver;
  signingKey?: string;
  signingKeyId?: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
  claimExpirationCheck?: boolean;
  includeDetailedResults?: boolean;
  storage?: {
    transactions?: IStorage<Transaction>;
    tokens?: IStorage<TokenRecord>;
    presentations?: IStorage<PresentationDefinition>;
  };
}

/**
 * Main entry point for the Verifier SDK
 * Provides functionality to create and verify OpenID4VP requests
 */
export class VerifierSDK {
  private static readonly DEFAULT_OPTIONS = {
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 30 * 24 * 3600,
    claimExpirationCheck: true,
  };

  // Storage instances
  private readonly transactionStorage: IStorage<Transaction>;
  private readonly presentationStorage: IStorage<PresentationDefinition>;
  private readonly tokenStorage: IStorage<TokenRecord>;

  private constructor(
    private readonly options: Required<VerifierSDKOptions> & {
      storage: {
        transactions: IStorage<Transaction>;
        tokens: IStorage<TokenRecord>;
        presentations: IStorage<PresentationDefinition>;
      };
    },
  ) {
    this.transactionStorage = options.storage.transactions;
    this.tokenStorage = options.storage.tokens;
    this.presentationStorage = options.storage.presentations;
  }

  /**
   * Create a new VerifierSDK instance
   * @param options Configuration options
   * @returns A new VerifierSDK instance
   */
  public static create(options: VerifierSDKOptions): VerifierSDK {
    // Validate required options
    ValidationUtils.validateOptions(options, ['baseUrl', 'clientId', 'credentialProcessor']);

    // Declared as optional field in options. Enforce consistency
    // if (!options.signingKey) {
    //   throw new Error('signingKey is required for token operations');
    // }

    // Set up storage
    const storage = {
      transactions: options.storage?.transactions || new InMemoryStorage(),
      tokens: options.storage?.tokens || new InMemoryStorage(),
      presentations: options.storage?.presentations || new InMemoryStorage(),
    };

    // Merge defaults with provided options
    const mergedOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options,
      storage,
    } as Required<VerifierSDKOptions> & {
      storage: {
        transactions: IStorage<Transaction>;
        tokens: IStorage<TokenRecord>;
        presentations: IStorage<PresentationDefinition>;
      };
    };

    return new VerifierSDK(mergedOptions);
  }

  /**
   * Create a presentation definition
   * @param params All parameters needed to create a presentation definition
   * @returns A complete presentation definition
   */
  async createPresentationDefinition(params: {
    credentialTypes?: string[];
    proofTypes?: string[];
    constraints?: Record<string, unknown>[];
    format?: FormatDefinition;
    submissionRequirements?: SubmissionRequirement[];
    id?: string;
    name?: string;
    purpose?: string;
  }): Promise<PresentationDefinition> {
    const builder = new PresentationRequestBuilder(this.presentationStorage);

    // Apply all parameters to builder
    if (params.id) {
      builder.withId(params.id);
    }

    if (params.name) {
      builder.withName(params.name);
    }

    if (params.purpose) {
      builder.withPurpose(params.purpose);
    }

    if (params.credentialTypes && params.credentialTypes.length > 0) {
      builder.withCredentialTypes(params.credentialTypes);
    }

    if (params.proofTypes && params.proofTypes.length > 0) {
      builder.withProofTypes(params.proofTypes);
    }

    if (params.constraints && params.constraints.length > 0) {
      builder.withConstraints(params.constraints);
    }

    if (params.format) {
      builder.withFormat(params.format);
    }

    if (params.submissionRequirements && params.submissionRequirements.length > 0) {
      builder.withSubmissionRequirements(params.submissionRequirements);
    }

    // Build, save and return the presentation definition
    return builder.build();
  }

  /**
   * Create an authorization request with QR code
   * @param params Authorization request parameters
   * @returns The authorization request with transaction ID, QR code, etc.
   */
  async createAuthorizationRequest(params: {
    presentationDefinition?: PresentationDefinition;
    presentationDefinitionUri?: string;
    nonce?: string;
    state?: string;
    redirectUri?: string;
    clientMetadata?: Record<string, unknown>;
    qrCodeOptions?: QRCodeOptions;
  }): Promise<AuthorizationRequest> {
    const builder = new AuthorizationRequestBuilder(this.transactionStorage, {
      baseUrl: this.options.baseUrl,
      clientId: this.options.clientId,
    });

    if (params.presentationDefinition) {
      builder.withPresentationDefinition(params.presentationDefinition);
    }

    if (params.presentationDefinitionUri) {
      builder.withPresentationDefinitionUri(params.presentationDefinitionUri);
    }

    if (params.nonce) {
      builder.withNonce(params.nonce);
    }

    if (params.state) {
      builder.withState(params.state);
    }

    if (params.redirectUri) {
      builder.withRedirectUri(params.redirectUri);
    }

    if (params.clientMetadata) {
      builder.withClientMetadata(params.clientMetadata);
    }

    if (params.qrCodeOptions) {
      builder.withQRCodeOptions(params.qrCodeOptions);
    }

    return builder.build();
  }

  /**
   * Process a wallet response for a request URI
   * This handles the wallet's request to get presentation definition information
   * @param params Request URI processing parameters
   * @returns Authorization response and optional JWT
   */
  async processRequestUri(params: {
    transactionId: string;
    walletMetadata?: string;
    walletNonce?: string;
  }): Promise<{
    response: AuthorizationResponse;
    jwt?: string;
    error?: {
      code: string;
      description: string;
    };
  }> {
    const builder = new RequestUriProcessorBuilder(params.transactionId, this.transactionStorage, {
      baseUrl: this.options.baseUrl,
      clientId: this.options.clientId,
      signingKey: this.options.signingKey,
      signingKeyId: this.options.signingKeyId,
    });

    if (params.walletMetadata) {
      builder.withWalletMetadata(params.walletMetadata);
    }

    if (params.walletNonce) {
      builder.withWalletNonce(params.walletNonce);
    }

    const result = await builder.build();

    // Return both the AuthorizationResponse object and the JWT string (if available)
    return {
      response: result.response,
      jwt: result.jwt,
      error: result.error,
    };
  }

  /**
   * Get a presentation definition by ID
   * @param params Parameters containing the presentation definition ID
   * @returns The requested presentation definition
   * @throws Error if presentation definition is not found
   */
  async getPresentationDefinition(params: {
    presentationDefinitionId: string;
  }): Promise<PresentationDefinition> {
    // Validate input parameters
    if (!params.presentationDefinitionId) {
      throw new Error('presentationDefinitionId is required');
    }

    // Extract ID from the parameter (handle both full URIs and simple IDs)
    let id = params.presentationDefinitionId;

    // If the ID is a URI, extract just the ID portion
    if (id.includes('/')) {
      // Get the last part of the URI path
      const segments = id.split('/');
      id = segments[segments.length - 1];
    }

    try {
      // Try to retrieve the presentation definition from storage
      const presentationDefinition = await this.presentationStorage.get(id);

      if (!presentationDefinition) {
        throw new Error(`Presentation definition not found with ID: ${id}`);
      }

      return presentationDefinition;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to retrieve presentation definition: ${errorMessage}`);
    }
  }

  /**
   * Process a presentation response from a wallet
   * @param params Presentation verification parameters
   * @returns Response indicating status and potentially a redirect URI
   */
  async verifyPresentation(params: {
    vpToken: string | object;
    presentationSubmission: string | object;
    state: string;
    transactionId?: string;
    options?: VerificationOptions;
  }): Promise<PresentationResponse> {
    const builder = new PresentationVerificationBuilder(
      this.transactionStorage,
      this.options.credentialProcessor,
      this.options.holderDidResolver,
      {
        baseUrl: this.options.baseUrl,
        clientId: this.options.clientId,
        checkExpiration: this.options.claimExpirationCheck,
        accessTokenExpiresIn: this.options.accessTokenExpiresIn,
      },
    );

    // Configure the builder with all required parameters
    builder.withVpToken(params.vpToken);
    builder.withPresentationSubmission(params.presentationSubmission);

    // Use transactionId from params if provided, otherwise use state as transactionId
    const transactionId = params.transactionId || params.state;
    builder.withTransactionId(transactionId);

    if (params.options) {
      builder.withVerificationOptions(params.options);
    }

    return builder.verify();
  }

  /**
   * Exchange a response code for tokens (access_token, id_token and refresh_token)
   * @param params Token exchange parameters
   * @returns Token response with access_token, id_token, refresh_token and claims
   */
  async exchangeCodeForToken(params: {
    responseCode: string;
    clientId: string;
  }): Promise<TokenResponse> {
    // Validate required parameters
    ValidationUtils.validateRequired(params.responseCode, 'responseCode');
    ValidationUtils.validateRequired(params.clientId, 'clientId');

    try {
      // Create TokenManager instance
      const tokenManager = new TokenManager(this.tokenStorage, {
        clientId: this.options.clientId,
        issuerId: this.options.baseUrl,
        signingKey: this.options.signingKey,
        signingKeyId: this.options.signingKeyId,
        accessTokenExpiresIn: this.options.accessTokenExpiresIn,
        refreshTokenExpiresIn: this.options.refreshTokenExpiresIn,
      });

      // Create TokenExchangeBuilder instance
      const builder = new TokenExchangeBuilder(
        tokenManager,
        this.transactionStorage,
        this.options.clientId,
      );

      // Configure and execute the token exchange
      return await builder
        .withResponseCode(params.responseCode)
        .withClientId(params.clientId)
        .exchange();
    } catch (error) {
      throw new Error(
        `Token exchange failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Refresh access and ID tokens using a refresh token
   * @param params Token refresh parameters
   * @returns New access and ID tokens
   */
  async refreshTokens(params: { refreshToken: string; clientId: string }): Promise<TokenResponse> {
    const builder = new TokenRefreshBuilder(
      new TokenManager(this.tokenStorage, {
        clientId: this.options.clientId,
        issuerId: this.options.baseUrl,
        signingKey: this.options.signingKey,
        signingKeyId: this.options.signingKeyId,
        accessTokenExpiresIn: this.options.accessTokenExpiresIn,
        refreshTokenExpiresIn: this.options.refreshTokenExpiresIn,
      }),
      this.options.clientId,
    );

    return builder.withRefreshToken(params.refreshToken).withClientId(params.clientId).refresh();
  }
}
