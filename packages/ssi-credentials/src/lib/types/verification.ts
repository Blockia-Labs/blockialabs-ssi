export interface VerificationResult {
  valid: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}

export interface VerificationOptions {
  checkExpiration?: boolean;
  checkStatus?: boolean;
  checkSchema?: boolean;
  verificationTime?: Date;
  contextHashes?: Record<string, string>;
}
