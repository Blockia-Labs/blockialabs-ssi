import { ISessionManager } from './interfaces/index.js';
import {
  ICompleteOptions,
  CredentialProcessor,
  SignatureType,
  ProofType,
  ProofPurpose,
} from '@blockialabs/ssi-credentials';
import {
  DeferredCredentialErrorCode,
  DeferredCredentialResponse,
  IssueStatus,
} from './types/index.js';

export class ApprovalBuilder {
  private completeOptions: Partial<ICompleteOptions> = {};

  constructor(
    private readonly transactionId: string,
    private readonly sessionManager: ISessionManager,
    private readonly credentialProcessor: CredentialProcessor,
  ) {}

  /**
   * Set all complete options at once
   */
  public withCompleteOptions(options: ICompleteOptions): this {
    this.completeOptions = { ...options };
    return this;
  }

  public withVerificationMethod(method: string): this {
    this.completeOptions.verificationMethod = method;
    return this;
  }

  public withSignatureType(type: SignatureType): this {
    this.completeOptions.signatureType = type;
    return this;
  }

  public withSignature(signature: string): this {
    this.completeOptions.signature = signature;
    return this;
  }

  public withProofType(type: ProofType): this {
    this.completeOptions.proofType = type;
    return this;
  }

  public withProofPurpose(purpose: ProofPurpose): this {
    this.completeOptions.proofPurpose = purpose;
    return this;
  }

  public withChallenge(challenge: string): this {
    this.completeOptions.challenge = challenge;
    return this;
  }

  public withDomain(domain: string): this {
    this.completeOptions.domain = domain;
    return this;
  }

  public async build(): Promise<DeferredCredentialResponse> {
    try {
      // 1. Validate complete options
      this.validateCompleteOptions();

      // 2. Get session with pending credential
      const session = await this.sessionManager.get(this.transactionId);
      if (!session?.pendingCredential || !session.transactionId) {
        return {
          error: DeferredCredentialErrorCode.INVALID_TRANSACTION_ID,
          error_description: 'No pending credential found',
        };
      }

      // 3. Verify session is in DEFERRED state
      if (session.issuerState !== IssueStatus.DEFERRED) {
        return {
          error: DeferredCredentialErrorCode.INVALID_TRANSACTION_ID,
          error_description: 'Invalid session state',
        };
      }

      // 4. Complete credential issuance
      const signedCredential = await this.credentialProcessor.completeIssuance(
        session.pendingCredential,
        this.completeOptions as ICompleteOptions,
      );

      // 5. Update session with issued credential
      await this.sessionManager.createOrUpdate(session.id, {
        issuerState: IssueStatus.CREDENTIAL_ISSUED,
        credentialResponse: signedCredential,
      });

      // 6. Return success response
      return {
        credentials: [
          {
            credential: signedCredential,
          },
        ],
        notification_id: session.notificationId,
      };
    } catch (error) {
      return {
        error: DeferredCredentialErrorCode.ISSUANCE_FAILED,
        error_description: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateCompleteOptions(): void {
    if (!this.completeOptions.verificationMethod) {
      throw new Error('Verification method is required');
    }
    if (!this.completeOptions.signatureType) {
      throw new Error('Signature type is required');
    }
    if (!this.completeOptions.signature) {
      throw new Error('Signature is required');
    }
    if (!this.completeOptions.proofType) {
      throw new Error('Proof type is required');
    }
    if (!this.completeOptions.proofPurpose) {
      throw new Error('Proof purpose is required');
    }
  }
}
