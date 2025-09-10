export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly key?: string,
  ) {
    super(message);
    this.name = 'StorageError';
  }

  static keyNotFound(key: string): StorageError {
    return new StorageError(`Key not found: ${key}`, 'STORAGE_KEY_NOT_FOUND', key);
  }

  static invalidKey(key: string): StorageError {
    return new StorageError(`Invalid key: ${key}`, 'STORAGE_INVALID_KEY', key);
  }

  static invalidValue(value: never): StorageError {
    return new StorageError(`Invalid value: ${value}`, 'STORAGE_INVALID_VALUE', value);
  }

  static driverError(message: string): StorageError {
    return new StorageError(`Storage driver error: ${message}`, 'STORAGE_DRIVER_ERROR');
  }
}
