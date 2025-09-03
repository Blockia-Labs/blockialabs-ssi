import { DID_REGEX } from '../../constants/index.js';

export class DIDStringValidator {
  private static DID_REGEX = DID_REGEX;

  /**
   * Checks if a given string is a valid DID according to the W3C DID syntax.
   * @param did - The DID string to validate.
   * @returns True if the DID is valid, false otherwise.
   */
  static isValidDID(did: string): boolean {
    // First check against regex pattern
    if (!this.DID_REGEX.test(did)) {
      return false;
    }

    // Extract components
    const parts = did.split(':');
    if (parts.length < 3) return false;

    const prefix = parts[0];
    const method = parts[1];
    const methodSpecificId = this.extractMethodSpecificId(parts.slice(2).join(':'));

    // Validate components for a DID Syntax
    return prefix === 'did' && method.length > 0 && methodSpecificId.length > 0;
  }

  /**
   * Checks if a given string is a valid verification method ID (DID URL with fragment or regular URL with fragment).
   * @param id - The verification method ID to validate.
   * @returns True if the verification method ID is valid, false otherwise.
   */
  static isValidVerificationMethodId(id: string): boolean {
    // Case 1: DID URL syntax with fragment
    if (id.startsWith('did:')) {
      return DIDStringValidator.isValidDID(id) && id.includes('#');
    }

    // Case 2: Regular URL syntax with fragment
    try {
      const url = new URL(id);
      return url.hash.length > 0;
    } catch {
      return false; // Not a valid URL
    }
  }

  /**
   * Extract the method-specific ID by removing path, query, and fragment
   * @param idWithPossibleExtras - The method-specific ID possibly containing path/query/fragment
   * @returns The clean method-specific ID
   */
  private static extractMethodSpecificId(idWithPossibleExtras: string): string {
    const delimiters = ['/', '?', '#'];

    // Find the position of the first delimiter
    let firstDelimiterPos = -1;

    for (const delimiter of delimiters) {
      const pos = idWithPossibleExtras.indexOf(delimiter);
      if (pos > -1 && (firstDelimiterPos === -1 || pos < firstDelimiterPos)) {
        firstDelimiterPos = pos;
      }
    }

    // Return either the full string or the substring before the first delimiter
    return firstDelimiterPos > -1
      ? idWithPossibleExtras.substring(0, firstDelimiterPos)
      : idWithPossibleExtras;
  }
}
