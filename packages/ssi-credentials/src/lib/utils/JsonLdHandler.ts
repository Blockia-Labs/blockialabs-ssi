import { ICredential } from '../types/index.js';
import { ICredentialFormatHandler } from '../interfaces/processors.js';
import { jsonLdCanonicalize } from './jsonLd-canonicalize.js';

/**
 * Handler for JSON-LD formatted credentials
 * Implements the ICredentialFormatHandler interface
 */
export class JsonLdHandler implements ICredentialFormatHandler {
  /**
   * Canonicalize credential for signing/verification
   *
   * @param credential - The credential to canonicalize
   * @param options - Optional parameters including context hashes for verification
   * @returns The canonicalized credential as a string
   */
  async canonicalize(
    credential: ICredential,
    options?: { contextHashes?: Record<string, string> },
  ): Promise<string> {
    return jsonLdCanonicalize(credential, options?.contextHashes);
  }
}
