import { VerificationStatus } from '../types/PresentationResponse.js';
import { ValidationUtils } from '../utils/ValidationUtils.js';
import { Transaction } from '../types/Authorization.js';
import { IStorage } from '@blockialabs/ssi-storage';
import { CredentialProcessor } from '@blockialabs/ssi-credentials';
import { ResponseValidator } from '../utils/ResponseValidator.js';
import { IDIDResolver } from '@blockialabs/ssi-did';
import { ClaimWithMetadata } from '../types/ClaimTypes.js';
import { PresentationResponse, VerificationOptions } from '../types/PresentationResponse.js';

/**
 * Builder for verifying presentation responses
 */
export class PresentationVerificationBuilder {
  private vpToken: any;
  private presentationSubmission: any;
  private transactionId?: string;
  private verificationOptions?: VerificationOptions;

  /**
   * Create a new presentation verification builder
   * @param transactionStorage Storage for transactions
   * @param credentialProcessor Processor for verifying credentials
   * @param didResolver DID resolver for VP proof verification
   * @param options Configuration options
   */
  constructor(
    private readonly transactionStorage: IStorage<Transaction>,
    private readonly credentialProcessor: CredentialProcessor,
    private readonly didResolver: IDIDResolver,
    private readonly options?: {
      baseUrl: string;
      clientId: string;
      checkExpiration?: boolean;
      accessTokenExpiresIn?: number;
    },
  ) {}

  /**
   * Set the VP token to verify
   * @param vpToken VP token in string or parsed format
   */
  withVpToken(vpToken: string | any): this {
    try {
      this.vpToken = typeof vpToken === 'string' ? JSON.parse(vpToken) : vpToken;
    } catch (error) {
      throw new Error('Invalid VP token format: must be a valid JSON string or object');
    }
    return this;
  }

  /**
   * Set the presentation submission metadata
   * @param submission Presentation submission in string or parsed format
   */
  withPresentationSubmission(submission: string | any): this {
    try {
      this.presentationSubmission =
        typeof submission === 'string' ? JSON.parse(submission) : submission;
    } catch (error) {
      throw new Error(
        'Invalid presentation submission format: must be a valid JSON string or object',
      );
    }
    return this;
  }

  /**
   * Set the transaction ID to correlate with the original request
   * @param transactionId Transaction ID
   */
  withTransactionId(transactionId: string): this {
    this.transactionId = transactionId;
    return this;
  }

  /**
   * Set custom verification options
   * @param options Verification options
   */
  withVerificationOptions(options: VerificationOptions): this {
    this.verificationOptions = options;
    return this;
  }

  /**
   * Verify the presentation and process the results
   * @returns Verification response
   */
  async verify(): Promise<PresentationResponse> {
    // Validate required inputs
    ValidationUtils.validateRequired(this.vpToken, 'vpToken');
    ValidationUtils.validateRequired(this.presentationSubmission, 'presentationSubmission');
    ValidationUtils.validateRequired(this.transactionId, 'state');

    // At this point, transactionId is validated and not undefined
    // TypeScript doesn't know this, so we need to assert it
    const transactionId = this.transactionId as string;

    // Retrieve the transaction
    const transaction = await this.transactionStorage.get(transactionId);
    if (!transaction) {
      throw new Error(`Invalid or expired transaction ID: ${transactionId}`);
    }

    try {
      // Create verification options from builder options and transaction data
      const verifyOptions = this.verificationOptions || {
        nonce: transaction.nonce,
        domain: this.options?.clientId,
        checkExpiration: this.options?.checkExpiration,
      };

      // Use the ResponseValidator to validate the VP token
      // Now passing the didResolver as a required parameter for VP proof verification
      const validationResult = await ResponseValidator.validateVpToken(
        this.credentialProcessor,
        this.didResolver,
        this.vpToken,
        this.presentationSubmission,
        verifyOptions,
      );

      if (!validationResult.valid) {
        // Update transaction with error status
        await this.transactionStorage.set(transactionId, {
          ...transaction,
          status: VerificationStatus.FAILED,
          error: validationResult.reason,
          vpErrors: validationResult.errors,
        });

        return {
          transactionId,
          verified: false,
          errors: validationResult.errors,
        };
      }

      // Extract claims from VP token
      let claims: ClaimWithMetadata[] = [];
      try {
        claims = ResponseValidator.extractClaims(this.vpToken);
      } catch (error) {
        console.warn('Error extracting claims:', error);
      }

      // Extract holder DID from VP token
      let holderDid: string | undefined;
      if (this.vpToken.holder) {
        // If holder property exists directly in the VP
        holderDid = this.vpToken.holder;
      } else if (this.vpToken.proof && this.vpToken.proof.verificationMethod) {
        // Extract DID from verification method (typically in format did:method:id#key-1)
        holderDid = this.vpToken.proof.verificationMethod.split('#')[0];
      } else if (
        Array.isArray(this.vpToken.proof) &&
        this.vpToken.proof.length > 0 &&
        this.vpToken.proof[0].verificationMethod
      ) {
        // Handle case with array of proofs
        holderDid = this.vpToken.proof[0].verificationMethod.split('#')[0];
      } else if (
        this.vpToken.verifiableCredential &&
        this.vpToken.verifiableCredential.length > 0 &&
        this.vpToken.verifiableCredential[0].credentialSubject &&
        this.vpToken.verifiableCredential[0].credentialSubject.id
      ) {
        // Extract from first credential's subject id
        holderDid = this.vpToken.verifiableCredential[0].credentialSubject.id;
      }

      // Generate response code (a unique token to reference this verified presentation)
      const responseCode = this.generateResponseCode();

      // Check claim expiration if configured
      if (this.options?.checkExpiration && ResponseValidator.hasExpired(this.vpToken)) {
        await this.transactionStorage.set(transactionId, {
          ...transaction,
          status: VerificationStatus.FAILED,
          error: 'One or more credentials have expired',
        });

        throw new Error('One or more credentials have expired');
      }

      // Update transaction with success status and extracted data
      await this.transactionStorage.set(transactionId, {
        ...transaction,
        status: VerificationStatus.VERIFIED,
        responseCode,
        presentationSubmission: this.presentationSubmission,
        // Store the holder DID in the transaction
        holderDid,
        // TODO move claims to a separate storage / with expiration
        claims,
        verifiedAt: Date.now(),
      });

      // Determine if redirect is required (same-device flow)
      const redirectUri = transaction.redirectUri
        ? `${transaction.redirectUri}?response_code=${responseCode}`
        : undefined;

      return {
        transactionId,
        verified: true,
        redirectUri,
        responseCode,
        expiresIn: this.options?.accessTokenExpiresIn,
        verifiedAt: Date.now(),
        claims,
      };
    } catch (error) {
      // Update transaction with error
      await this.transactionStorage.set(transactionId, {
        ...transaction,
        status: VerificationStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Generate a unique response code for referencing the verification result
   * @returns A unique response code
   */
  private generateResponseCode(): string {
    // Simple implementation - in production, use a more robust method
    return `rc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }
}
