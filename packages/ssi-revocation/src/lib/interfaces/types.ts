import { StatusPurpose } from './enums.js';

export interface RevokeCredentialRequest {
  credentialId: string;
  revokerDID: string;
  reason?: string;
}

export interface BitstringStatusListEntry {
  /**
   * An optional identifier for the status list entry.
   */
  id?: string;
  /**
   * The type property MUST be BitstringStatusListEntry.
   */
  type?: 'BitstringStatusListEntry';
  /**
   * The purpose of the status entry MUST be a string.
   */
  statusPurpose: StatusPurpose;
  /**
   * The statusListIndex property MUST be an arbitrary size integer greater than or equal to 0,
   * expressed as a string in base 10. The value identifies the position of the status of the verifiable credential.
   *  Implementations SHOULD assign indexes randomly,
   *  such that inferences — such as the recency of the assignment or the size of the group
   *  — cannot be easily drawn from that position.
   */
  statusListIndex?: string;
  /**
   * The statusListCredential property MUST be a URL to a verifiable credential.
   *  When the URL is dereferenced, the resulting verifiable credential MUST have type property that includes
   *  the BitstringStatusListCredential value.
   */
  statusListCredential?: string;
  /**
   * Size of the status list. Must be a number greater than 0.
   * Defaults to 1 if not specified.
   */
  statusSize?: number;
  /**
   * Array of status messages corresponding to possible status values.
   * - Length must equal number of possible statuses (2^statusSize)
   * - Required if statusSize > 1, optional if statusSize = 1
   * - If absent, status bit values 1 and 0 mean "set" and "unset" respectively
   * - Each element should contain:
   *   - status: Hexadecimal string prefixed with 0x
   *   - message: Developer-oriented debug message (not for end users)
   */
  statusMessage?: string[];
  /**
   * An implementer MAY include the statusReference property.
   *  If present, its value MUST be a URL or an array of URLs [URL] which dereference to material
   *  related to the status. Implementers using a statusPurpose of message are strongly encouraged to provide
   *  a statusReference.
   */
  statusReference?: string | string[];
}

export interface BitstringStatusListCredential {
  /**
   * The verifiable credential that contains the status list MAY express an id property that matches the value
   * specified in statusListCredential for the corresponding BitstringStatusListEntry
   */
  id?: string;
  /**
   * The type property MUST be BitstringStatusListCredential.
   */
  type?: 'BitstringStatusListCredential';
  /**
   * The earliest point in time at which the status list is valid.
   * This property is defined in the Verifiable Credentials Data Model specification
   */
  validFrom?: string;
  /**
   * The latest point in time at which the status list is valid.
   * This property is defined in the Verifiable Credentials Data Model specification
   */
  validUntil?: string;
  credentialSubject: CredentialSubject;
}

export interface CredentialSubject {
  /**
   * The type property MUST be BitstringStatusList.
   */
  type?: 'BitstringStatusList';
  /**
   * The statusPurpose MUST be one of the four enums.
   */
  statusPurpose: StatusPurpose;
  /**
   * The encoded list must be multibase-encoded base64 URL with no padding.
   * This represents the compressed bitstring containing all status information.
   */
  encodedList?: string;
  /**
   * The ttl is an OPTIONAL property that indicates the "time to live"
   * in milliseconds before a refresh SHOULD be attempted.
   */
  ttl?: number;
}

export interface RevocationRecord {
  id: string;
  credentialId: string;
  revokerDID: string;
  reason?: string;
  revokedAt: string;
  statusList: BitstringStatusListCredential;
}
