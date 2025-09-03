export class WalletSDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public override readonly cause?: Error,
  ) {
    super(message);
    this.name = 'WalletSDKError';
  }
}

export class ValidationError extends WalletSDKError {
  constructor(message: string, cause?: Error) {
    super(message, 'VALIDATION_ERROR', cause);
    this.name = 'ValidationError';
  }
}

export class CryptographyError extends WalletSDKError {
  constructor(message: string, cause?: Error) {
    super(message, 'CRYPTOGRAPHY_ERROR', cause);
    this.name = 'CryptographyError';
  }
}

export class StorageError extends WalletSDKError {
  constructor(message: string, cause?: Error) {
    super(message, 'STORAGE_ERROR', cause);
    this.name = 'StorageError';
  }
}
