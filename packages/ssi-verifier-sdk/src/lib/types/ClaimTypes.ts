import { ICredential, IProof, Context } from '@blockialabs/ssi-credentials';

/**
 * Defines the structure of a verifiable presentation containing credentials
 */
export interface IVerifiablePresentation {
  '@context': Context[];
  'type': string[];
  'id'?: string;
  'holder'?: string;
  'verifiableCredential': ICredential[];
  'proof'?: IProof | IProof[];
}

/**
 * Metadata associated with a claim
 */
export interface ClaimMetadata {
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  type: string[];
  context: string[];
}

/**
 * A claim with its associated metadata
 */
export interface ClaimWithMetadata {
  claim: Record<string, any>;
  metadata: ClaimMetadata;
}
