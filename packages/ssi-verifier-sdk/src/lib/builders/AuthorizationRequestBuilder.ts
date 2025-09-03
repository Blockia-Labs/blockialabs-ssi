import { AuthorizationRequest, Transaction } from '../types/Authorization.js';
import { IStorage } from '@blockialabs/ssi-storage';
import { PresentationDefinition } from '../types/PresentationDefinition.js';
import { QRCodeGenerator } from '../utils/QRCodeGenerator.js';
import { QRCodeOptions } from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { ValidationUtils } from '../utils/ValidationUtils.js';
import { VerificationStatus } from '../types/PresentationResponse.js';

/**
 * Builder for creating authorization requests
 */
export class AuthorizationRequestBuilder {
  private id: string = uuidv4();
  private presentationDefinition?: PresentationDefinition;
  private presentationDefinitionUri?: string;
  private state?: string;
  private nonce?: string = uuidv4();
  private redirectUri?: string;
  private clientMetadata: Record<string, any> = {};
  private qrCodeOptions?: QRCodeOptions;

  constructor(
    private readonly transactionStorage: IStorage<Transaction>,
    private readonly options: {
      baseUrl: string;
      clientId: string;
    },
  ) {}

  /**
   * Set the presentation definition
   */
  public withPresentationDefinition(presentationDefinition: PresentationDefinition): this {
    this.presentationDefinition = presentationDefinition;
    return this;
  }

  /**
   * Set the presentation definition URI
   */
  public withPresentationDefinitionUri(presentationDefinitionUri: string): this {
    this.presentationDefinitionUri = ValidationUtils.validateUrl(
      presentationDefinitionUri,
      'presentationDefinitionUri',
    );
    return this;
  }

  /**
   * Set the state parameter
   */
  public withState(state: string): this {
    this.state = state;
    return this;
  }

  /**
   * Set the nonce parameter
   */
  public withNonce(nonce: string): this {
    this.nonce = nonce;
    return this;
  }

  /**
   * Set the redirect URI
   */
  public withRedirectUri(redirectUri: string): this {
    this.redirectUri = ValidationUtils.validateUrl(redirectUri, 'redirectUri');
    return this;
  }

  /**
   * Set the transaction ID (overrides default UUID generation)
   */
  public withTransactionId(id: string): this {
    this.id = id;
    return this;
  }

  /**
   * Set the client metadata
   */
  public withClientMetadata(clientMetadata: Record<string, any>): this {
    this.clientMetadata = clientMetadata;
    return this;
  }

  /**
   * Set QR code generation options
   */
  public withQRCodeOptions(options: QRCodeOptions): this {
    this.qrCodeOptions = options;
    return this;
  }

  /**
   * Build the authorization request
   */
  public async build(): Promise<AuthorizationRequest> {
    if (!this.presentationDefinition && !this.presentationDefinitionUri) {
      throw new Error('Presentation definition or presentation uri is required');
    }

    // Create request URI and response URI
    const requestUri = `${this.options.baseUrl}/request/${this.id}`;
    const responseUri = `${this.options.baseUrl}/response/${this.id}`;

    // Create the authorization request object
    const request: AuthorizationRequest = {
      id: this.id,
      clientId: this.options.clientId,
      state: this.state,
      nonce: this.nonce,
      redirectUri: this.redirectUri,
      createdAt: Date.now(),
      expiresIn: 300, // Default 5 minutes
      requestUri,
      responseUri,
    };

    // Generate OpenID4VP QR code and URL
    const qrResult = await QRCodeGenerator.generateOpenID4VP(requestUri, this.options.clientId, {
      ...this.qrCodeOptions,
      request_uri_method: 'post', // Default to POST method, can be overridden by qrCodeOptions
    });

    // Add QR code and URL to the request
    request.qrCode = qrResult.qrCode;
    request.openId4VPUrl = qrResult.url;

    // Add either presentationDefinition or presentationDefinitionUri based on what was provided
    if (this.presentationDefinition) {
      request.presentationDefinition = this.presentationDefinition;
    } else if (this.presentationDefinitionUri) {
      request.presentationDefinitionUri = this.presentationDefinitionUri;
    }

    // TODO see how we can reuse the auth request to store instead of recreating it as transaction

    // Store the transaction
    await this.transactionStorage.set(this.id, {
      id: this.id,
      status: VerificationStatus.PENDING,
      createdAt: request.createdAt,
      expiresAt: request.createdAt + (request.expiresIn ?? 300) * 1000,
      nonce: this.nonce || '',
      state: this.state || '',
      presentationDefinition: {
        uri: this.presentationDefinitionUri,
        definition: this.presentationDefinition,
      },
      clientMetadata: this.clientMetadata,
      redirectUri: this.redirectUri,
      openId4VPUrl: request.openId4VPUrl,
    });

    return request;
  }
}
