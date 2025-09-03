import { ISignatureProvider } from '@blockialabs/ssi-types';

export interface IssuerKeyPair {
  issuerId: string;
  keyId: string;
  publicKey: string;
  createdAt: Date;
}

export interface IIssuerKeyStore extends ISignatureProvider {
  /**
   * Generate a key pair by issuer ID
   */
  generateKeyPair(issuerId: string): Promise<IssuerKeyPair>;

  /**
   * Get public key by issuer ID
   */
  getPublicKey(issuerId: string): Promise<string>;

  /**
   * Delete the key pair for an issuer
   */
  deleteKey(issuerId: string): Promise<void>;

  /**
   * Check if a key exists for the given issuer ID
   */
  hasKey(issuerId: string): Promise<boolean>;
}
