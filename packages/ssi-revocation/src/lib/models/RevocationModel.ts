import { RevocationError } from '../errors/RevocationError.js';
import { BitstringStatusListCredential, RevocationRecord } from '../interfaces/types.js';

export class RevocationModel implements RevocationRecord {
  id: string;
  credentialId: string;
  revokerDID: string;
  reason?: string;
  revokedAt: string;
  statusList: BitstringStatusListCredential;

  constructor(revocation: RevocationRecord) {
    this.id = revocation.id;
    this.credentialId = revocation.credentialId;
    this.revokerDID = revocation.revokerDID;
    this.reason = revocation.reason || '';
    this.revokedAt = revocation.revokedAt;
    this.statusList = revocation.statusList;

    if (!this.isValid()) {
      throw new RevocationError('Invalid revocation record');
    }
  }

  isValid(): boolean {
    const isRevocationValid =
      !!this.id &&
      !!this.credentialId &&
      !!this.revokerDID &&
      !!this.revokedAt &&
      !!this.statusList;

    return isRevocationValid;
  }
}
