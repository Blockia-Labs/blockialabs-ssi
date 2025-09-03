import { CredentialIdError, RevocationError } from '../errors/RevocationError.js';
import { IRevocationManager } from '../interfaces/signatures.js';
import { IStorage } from '@blockialabs/ssi-storage';
import { RevocationRecord, RevokeCredentialRequest } from '../interfaces/types.js';
import { StatusPurpose } from '../interfaces/enums.js';

export class RevocationCore implements IRevocationManager {
  private storage: IStorage<RevocationRecord>;

  constructor(storage: IStorage<RevocationRecord>) {
    this.storage = storage;
  }

  public async revokeCredential(record: RevokeCredentialRequest): Promise<void> {
    const credential = await this.storage.get(record.credentialId);

    if (!credential) {
      throw new CredentialIdError('Invalid credential id');
    }

    if (record.revokerDID !== credential.revokerDID) {
      throw new RevocationError('Unauthorized: Only the issuer can revoke this credential');
    }

    const status = credential.statusList.credentialSubject.statusPurpose;

    if (status === 'revocation') {
      throw new RevocationError('Credential is already revoked');
    }

    const updatedCredential = {
      ...credential,
      statusList: {
        ...credential.statusList,
        credentialSubject: {
          ...credential.statusList.credentialSubject,
          statusPurpose: StatusPurpose.REVOCATION,
        },
      },
    };
    await this.storage.set(record.credentialId, updatedCredential);
  }

  public async getStatusList(credentialId: string): Promise<StatusPurpose> {
    const credential = await this.storage.get(credentialId);

    if (!credential) {
      throw new CredentialIdError('Invalid credential id');
    }

    return credential.statusList.credentialSubject.statusPurpose;
  }
}
