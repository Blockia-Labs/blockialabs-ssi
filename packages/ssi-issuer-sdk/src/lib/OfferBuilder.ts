import { v4 as uuidv4 } from 'uuid';
import { ISessionManager } from './interfaces/session-manager.js';
import { CredentialOffer, CredentialOfferResult, TxCodeOptions } from './types.js';
import { CredentialOfferOptions, IssuerConfig } from './types/issuer.js';
import { CredentialOfferSession } from './types/session.js';
import { generateQRCode } from './utils/qrCode.js';
import { createCredentialOfferURI } from './utils/uri.js';

/**
 * Builder for creating credential offers
 */
export class OfferBuilder {
  private preAuthorizedCode: string = uuidv4();
  private txCode?: TxCodeOptions;
  private credentialTypes: string[] = [];
  private statusLists?: Array<any>;

  /**
   * Create a new offer builder
   * @param config Issuer configuration
   * @param sessionStorage Storage for sessions
   * @param options Options for the credential offer
   */
  constructor(
    private readonly config: IssuerConfig,
    private readonly sessionManager: ISessionManager,
    private readonly options: CredentialOfferOptions = {},
  ) {}

  /**
   * Specify credential types to include in the offer
   */
  public withCredentialTypes(types: string[]): this {
    this.credentialTypes = types;
    return this;
  }

  /**
   * Configure pre-authorized code
   */
  public withPreAuthorizedCode(code?: string): this {
    this.preAuthorizedCode = code || uuidv4();
    return this;
  }

  /**
   * Add transaction code (PIN) requirements
   */
  public withTxCode(options: TxCodeOptions = { length: 4 }): this {
    this.txCode = {
      length: options.length || 4,
      input_mode: options.input_mode || 'numeric',
    };
    return this;
  }

  /**
   * Add status list options for credential revocation
   */
  public withStatusList(statusList?: Array<any>): this {
    this.statusLists = statusList;
    return this;
  }

  /**
   * Build the credential offer
   */
  public async build(): Promise<CredentialOfferResult> {
    // Create the offer payload
    const offerPayload = this.createOfferPayload();

    // Generate PIN if transaction code is requested
    const pin = this.generatePin();

    // Create and store session
    const session = await this.createAndStoreSession(offerPayload, pin);

    // Generate URI
    const uri = createCredentialOfferURI(offerPayload, { baseUri: this.options.baseUrl });

    // Generate QR code if requested
    let qrCode: string | undefined;
    if (this.options.generateQR) {
      qrCode = await generateQRCode(uri, this.options.qrCodeOptions);
    }

    return {
      uri,
      qrCode,
      session,
      pin,
    };
  }

  /**
   * Create the credential offer payload
   */
  private createOfferPayload(): CredentialOffer {
    const grants: any = {};

    // Add pre-authorized code grant
    grants['urn:ietf:params:oauth:grant-type:pre-authorized_code'] = {
      'pre-authorized_code': this.preAuthorizedCode,
      ...(this.txCode && { tx_code: this.txCode }),
    };

    return {
      credential_issuer: this.config.credential_issuer,
      credential_configuration_ids:
        this.credentialTypes.length > 0
          ? this.credentialTypes
          : Object.keys(this.config.credential_configurations_supported),
      grants,
    };
  }

  /**
   * Generate a PIN for the transaction
   */
  private generatePin(): string | undefined {
    if (!this.txCode) return undefined;

    const length = this.txCode.length || 4;
    return String(Math.floor(Math.random() * Math.pow(10, length))).padStart(length, '0');
  }

  /**
   * Create and store a session for this credential offer
   */
  private async createAndStoreSession(
    offer: CredentialOffer,
    pin?: string,
  ): Promise<CredentialOfferSession> {
    const now = Date.now();

    const session: CredentialOfferSession = {
      id: uuidv4(),
      preAuthorizedCode: this.preAuthorizedCode,
      createdAt: now,
      lastUpdatedAt: now,
      notificationStatus: 'offer_created',
      notificationId: uuidv4(),
      pin,
      credentialOffer: offer,
      statusLists: this.statusLists,
    };

    // Store the session with its ID
    await this.sessionManager.createOrUpdate(session.id, session);

    return session;
  }
}
