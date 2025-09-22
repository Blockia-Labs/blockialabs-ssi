import { SignatureType } from '@blockialabs/ssi-types';
import { CredentialFormatType, ICredential } from './credentials.js';
import { ProofPurpose, ProofType } from './proof.js';

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
