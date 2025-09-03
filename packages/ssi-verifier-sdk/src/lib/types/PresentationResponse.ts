import { ClaimWithMetadata } from './ClaimTypes.js';

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

/**
 * Presentation verification options
 */
export interface VerificationOptions {
  verifyExpiration?: boolean;
  verifySignature?: boolean;
  verifyRevocation?: boolean;
  acceptedIssuers?: string[];
  requiredCredentialTypes?: string[];
  requiredClaimFields?: string[];
  requestTime?: Date;
  challenge?: string;
  domain?: string;
  nonce?: string;
}

export interface PresentationResponse {
  transactionId: string;
  verified: boolean;
  redirectUri?: string;
  responseCode?: string;
  expiresIn?: number;
  reason?: string;
  errors?: string[];
  claims?: ClaimWithMetadata[];
  verifiedAt?: number;
}
