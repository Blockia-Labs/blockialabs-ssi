import { CredentialProof, ProofValidationOptions } from '../types.js';

export interface IProofValidator {
  validate(proof: CredentialProof, opts: ProofValidationOptions): Promise<void>;
}
