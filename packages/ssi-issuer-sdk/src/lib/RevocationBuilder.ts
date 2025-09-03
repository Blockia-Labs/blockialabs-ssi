import { IRevocationManager, RevokeCredentialRequest } from '@blockialabs/ssi-revocation';

export class RevocationBuilder {
  private reason?: string;

  constructor(
    private readonly credentialId: string,
    private readonly revokerDID: string,
    private readonly revocationManager: IRevocationManager,
  ) {}

  /**
   * Add a reason for revocation
   * @param reason The reason for revoking the credential
   * @returns The builder instance for chaining
   */
  public withReason(reason: string): this {
    this.reason = reason;
    return this;
  }

  /**
   * Build and execute the revocation request
   * @returns Promise that resolves when revocation is complete
   */
  public async build(): Promise<void> {
    const request: RevokeCredentialRequest = {
      credentialId: this.credentialId,
      revokerDID: this.revokerDID,
      reason: this.reason,
    };

    await this.revocationManager.revokeCredential(request);
  }
}
