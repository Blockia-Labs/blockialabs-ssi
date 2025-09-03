export enum CredentialErrorCode {
  INVALID_CREDENTIAL_REQUEST = 'invalid_credential_request',
  UNSUPPORTED_CREDENTIAL_TYPE = 'unsupported_credential_type',
  UNSUPPORTED_CREDENTIAL_FORMAT = 'unsupported_credential_format',
  INVALID_PROOF = 'invalid_proof',
  INVALID_NONCE = 'invalid_nonce',
  INVALID_ENCRYPTION_PARAMETERS = 'invalid_encryption_parameters',
  CREDENTIAL_REQUEST_DENIED = 'credential_request_denied',
  INVALID_SESSION = 'invalid_session',
  INVALID_TOKEN_REQUEST = 'invalid_token_request',
}

export class CredentialError extends Error {
  constructor(
    public code: CredentialErrorCode,
    message?: string,
  ) {
    super(message || code);
    this.name = 'CredentialError';
  }
}
