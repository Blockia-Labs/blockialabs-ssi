import { v4 as uuidv4 } from 'uuid';
import { IProofValidator, ISessionManager } from './interfaces/index.js';
import { CredentialError, CredentialErrorCode } from './types/errors.js';
import {
  CNonceState,
  CredentialProof,
  CredentialRequest,
  CredentialResponse,
  IssuerConfig,
  IssueStatus,
  ProofValidationOptions,
} from './types/index.js';
import { CredentialOfferSession } from './types/session.js';
import {
  ICredential,
  CredentialProcessor,
  CredentialFormatType,
} from '@blockialabs/ssi-credentials';

/**
 * Builder for handling credential issuance requests
 */
export class RequestBuilder {
  private newNonce?: string;
  private nonceExpiresIn?: number;
  private credential?: ICredential;
  private request?: CredentialRequest;

  constructor(
    private readonly config: IssuerConfig,
    private readonly sessionManager: ISessionManager,
    private readonly credentialProcessor: CredentialProcessor,
    private readonly proofValidators: Map<string, IProofValidator>,
    private readonly opts: { responseCNonce: string },
  ) {}

  /**
   * Set the credential request
   */
  public withCredentialRequest(request: CredentialRequest): this {
    this.request = request;
    return this;
  }

  /**
   * Set the credential to be issued
   */
  public withCredential(credential: ICredential): this {
    this.credential = credential;
    return this;
  }

  /**
   * Configure nonce settings
   */
  public withNewNonce(nonce?: string, expiresIn?: number): this {
    this.newNonce = nonce;
    this.nonceExpiresIn = expiresIn;
    return this;
  }

  /**
   * Build and process the issuance request
   */
  public async build(): Promise<CredentialResponse> {
    if (!this.request || !this.credential) {
      throw new CredentialError(
        CredentialErrorCode.INVALID_CREDENTIAL_REQUEST,
        'Credential request and credential input are required',
      );
    }

    await this.validateFormat();

    const { session, nonceState } = await this.validateProofAndGetSession(this.opts.responseCNonce);

    const preparedCredential = await this.credentialProcessor.prepareIssuance(
      this.credential as ICredential,
      { credentialFormat: this.request.format as CredentialFormatType },
    );

    const transactionId = session.transactionId || uuidv4();
    const updatedSession = await this.sessionManager.createOrUpdate(session.id, {
      issuerState: IssueStatus.DEFERRED,
      pendingCredential: preparedCredential,
      transactionId,
    });

    if (this.newNonce) {
      await this.sessionManager.rotateNonce(nonceState, {
        newNonce: this.newNonce,
        expiresIn: this.nonceExpiresIn,
      });
    }

    return {
      notification_id: updatedSession.notificationId,
      transaction_id: updatedSession.transactionId,
    };
  }

  /**
   * Validate credential format
   */
  private async validateFormat(): Promise<void> {
    if (!this.request || (!('credential_identifier' in this.request) && !this.request.format)) {
      throw new CredentialError(
        CredentialErrorCode.INVALID_CREDENTIAL_REQUEST,
        'Request must include either credential_identifier or format',
      );
    }

    if (this.request.format && !this.isFormatSupported(this.request.format)) {
      throw new CredentialError(
        CredentialErrorCode.UNSUPPORTED_CREDENTIAL_FORMAT,
        `Unsupported format: ${this.request.format}`,
      );
    }
  }

  /**
   * Validate proof and retrieve session
   */
  private async validateProofAndGetSession(responseCNonce: string): Promise<{
    session: CredentialOfferSession;
    nonceState: CNonceState;
  }> {
    if (!this.request) {
      throw new CredentialError(
        CredentialErrorCode.INVALID_CREDENTIAL_REQUEST,
        'Credential request is required',
      );
    }

    const proof = this.request.proof;

    if (!proof) {
      throw new CredentialError(
        CredentialErrorCode.INVALID_PROOF,
        'Either proof or proofs must be present',
      );
    }

    // Validate all proof
    await this.validateProof(proof, {
      expectedNonce: responseCNonce,
      expectedAudience: this.config.credential_issuer,
    });

    // Get session by nonce
    return this.sessionManager.getByNonce(responseCNonce);
  }

  /**
   * Check if credential format is supported
   */
  private isFormatSupported(format: string): boolean {
    return Object.values(this.config.credential_configurations_supported).some(
      (config) => config.format === format,
    );
  }

  /**
   * Validate a single proof
   */
  private async validateProof(proof: CredentialProof, opts: ProofValidationOptions): Promise<void> {
    if (!proof.proof_type) {
      throw new CredentialError(CredentialErrorCode.INVALID_PROOF, 'Proof type is required');
    }

    const validator = this.proofValidators.get(proof.proof_type);
    if (!validator) {
      throw new CredentialError(
        CredentialErrorCode.INVALID_PROOF,
        `Unsupported proof type: ${proof.proof_type}`,
      );
    }

    await validator.validate(proof, opts);
  }
}
