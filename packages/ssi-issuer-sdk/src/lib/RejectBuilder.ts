import { ISessionManager } from './interfaces/index.js';
import {
  DeferredCredentialErrorCode,
  DeferredCredentialResponse,
  IssueStatus,
} from './types/index.js';

export interface RejectOptions {
  description?: string;
  code?: DeferredCredentialErrorCode;
}

export class RejectBuilder {
  private options: RejectOptions = {};

  constructor(
    private readonly transactionId: string,
    private readonly sessionManager: ISessionManager,
  ) {}

  public withDescription(description: string): this {
    this.options.description = description;
    return this;
  }

  public withErrorCode(code: DeferredCredentialErrorCode): this {
    this.options.code = code;
    return this;
  }

  public async build(): Promise<DeferredCredentialResponse> {
    try {
      // 1. Get session with pending credential
      const session = await this.sessionManager.get(this.transactionId);
      if (!session?.transactionId) {
        return {
          error: DeferredCredentialErrorCode.INVALID_TRANSACTION_ID,
          error_description: 'No pending request found',
        };
      }

      // 2. Verify session is in DEFERRED state
      if (session.issuerState !== IssueStatus.DEFERRED) {
        return {
          error: DeferredCredentialErrorCode.INVALID_TRANSACTION_ID,
          error_description: 'Invalid session state',
        };
      }

      // 3. Update session with rejection
      await this.sessionManager.createOrUpdate(session.id, {
        issuerState: IssueStatus.REJECTED,
        error: this.options.description,
      });

      // 4. Return rejection response
      return {
        error: this.options.code || DeferredCredentialErrorCode.ISSUANCE_REJECTED,
        error_description: this.options.description || 'Credential request rejected',
      };
    } catch (error) {
      return {
        error: DeferredCredentialErrorCode.ISSUANCE_FAILED,
        error_description: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
