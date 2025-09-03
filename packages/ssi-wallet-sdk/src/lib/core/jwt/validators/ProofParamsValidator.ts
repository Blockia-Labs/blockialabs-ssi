import { ProofParams } from '../../../types/index.js';

/**
 * Input validator
 */
export class ProofParamsValidator {
  public validate(params: ProofParams): void {
    this.validateRequired('privateKey', params.privateKey);
    this.validateRequired('holderDid', params.holderDid);
    this.validateRequired('issuerDid', params.issuerDid);
    this.validateRequired('nonce', params.nonce);

    this.validateHexKey(params.privateKey);
    this.validateDid(params.holderDid);
    this.validateDid(params.issuerDid);
  }

  private validateRequired(fieldName: string, value: string): void {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} is required and must be a non-empty string`);
    }
  }

  private validateHexKey(privateKey: string): void {
    const hexPattern = /^[0-9a-fA-F]+$/;
    if (!hexPattern.test(privateKey)) {
      throw new Error('privateKey must be a valid hexadecimal string');
    }

    if (privateKey.length !== 64) {
      throw new Error('privateKey must be 32 bytes (64 hex characters) for SECP256K1');
    }
  }

  private validateDid(did: string): void {
    if (!did.startsWith('did:')) {
      throw new Error('DID must start with "did:"');
    }
  }
}
