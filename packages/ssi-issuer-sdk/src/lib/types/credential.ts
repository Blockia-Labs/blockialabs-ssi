import { CredentialFormatType, ICredential } from '@blockialabs/ssi-credentials';

/**
 * Credential issuance status
 */
export enum IssueStatus {
  CREATED = 'created',
  PENDING = 'pending',
  ACCESS_TOKEN_CREATED = 'access_token_created',
  DEFERRED = 'deferred',
  CREDENTIAL_ISSUED = 'credential_issued',
  CREDENTIAL_CLAIMED = 'credential_claimed',
  REJECTED = 'rejected',
  ERROR = 'error',
}

/**
 * Base credential request interface
 */
export interface CredentialRequest {
  credential_identifier?: string;
  format?: CredentialFormatType;
  proof?: CredentialProof;
  [key: string]: any;
}

/**
 * Credential response returned after issuance
 */
export interface CredentialResponse {
  notification_id?: string;
  transaction_id?: string;
}

/**
 * Nonce state for credential requests
 */
export interface CNonceState {
  cNonce: string;
  createdAt: number;
  preAuthorizedCode?: string;
  issuerState?: string;
  expiresIn?: number;
}

export interface ProofValidationOptions {
  expectedNonce?: string;
  expectedAudience: string;
}

export interface ProofVerificationResult {
  verified: boolean;
  error?: string;
}

export interface CredentialProof {
  proof_type: string;
  jwt?: string;
  ldp_vp?: any;
  attestation?: any;
}

export enum DeferredCredentialErrorCode {
  ISSUANCE_PENDING = 'issuance_pending',
  INVALID_TRANSACTION_ID = 'invalid_transaction_id',
  ISSUANCE_FAILED = 'issuance_failed',
  ISSUANCE_REJECTED = 'issuance_rejected',
}

export interface DeferredCredentialRequest {
  transaction_id: string;
}

export interface DeferredCredentialResponse {
  credentials?: Array<{
    credential?: ICredential;
  }>;
  notification_id?: string;
  error?: DeferredCredentialErrorCode;
  error_description?: string;
  interval?: number;
}
