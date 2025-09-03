export class RevocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RevocationError';
  }
}

export class CredentialIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CredentialIdError';
  }
}
