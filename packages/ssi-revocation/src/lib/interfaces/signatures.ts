import { StatusPurpose } from './enums.js';
import { RevokeCredentialRequest } from './types.js';

/**
 * Interface defining the revocation service capabilities
 */
export interface IRevocationManager {
  /**
   * Revoke a verifiable credential
   * @param request The revoke credential request
   * @returns The created revocation record
   * @throws RevocationError if the credential is already revoked
   */
  revokeCredential(request: RevokeCredentialRequest): Promise<void>;

  getStatusList(credentialId: string): Promise<StatusPurpose>;
}
