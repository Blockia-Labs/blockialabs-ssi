import { ProofPurpose } from '@blockialabs/ssi-did';

export interface WebDIDCompleteOptions {
  /**
   * Optional proof purpose for the DID document proof.
   * Defaults to 'authentication' if not provided.
   */
  proofPurpose?: ProofPurpose;

  /**
   * Optional additional properties to include in the DID document.
   */
  additionalProperties?: Record<string, unknown>;

  /**
   * Optional domain for validation against the DID's domain.
   * When provided with validateDomain=true, ensures DID domain matches.
   */
  domain?: string;

  /**
   * Whether to validate the domain against the DID's domain.
   * Defaults to false.
   */
  validateDomain?: boolean;
}
