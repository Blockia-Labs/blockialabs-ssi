import { CredentialFormatType, ICredential } from './credentials.js';
import { ProofPurpose, ProofType } from './proof.js';

/**
 * Underlying signature algorithm types.
 * These represent the actual cryptographic signature algorithms,
 * not the W3C proof types that appear in the credential proof.
 *
 * This is different from ProofType, which represents the W3C standard proof types.
 */
export type SignatureType = 'P256' | 'Secp256k1' | 'JsonWebKey' | string;

export interface IPrepareOptions {
  proofType?: ProofType;
  proofPurpose?: ProofPurpose;
  challenge?: string;
  domain?: string;
  contextHashes?: Record<string, string>;
  credentialFormat?: CredentialFormatType;
  credentialSubject?: Record<string, string>;
  validUntil?: string;
}

export interface IIssueOptions extends IPrepareOptions {
  verificationMethod: string;
  signatureType: SignatureType;
}

export interface ICompleteOptions extends IIssueOptions {
  signature: string;
}

export interface IPreparedCredential {
  credential: ICredential;
  canonicalForm: string;
  options?: IPrepareOptions;
  credentialFormat?: CredentialFormatType;
}
