import { ICredential } from '../types/index.js';

/**
 * Interface for credential format handlers
 */
export interface ICredentialFormatHandler {
  /**
   * Canonicalize credential for signing/verification
   */
  canonicalize(
    credential: ICredential,
    options?: { contextHashes?: Record<string, string> },
  ): Promise<string>;
}
