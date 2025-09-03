/**
 * @interface IDIDDocumentVerificationResult
 * @description Represents the result of a DID document verification
 */
export interface IDIDDocumentVerificationResult {
  /**
   * @property {boolean} valid - Whether the document is valid
   */
  valid: boolean;

  /**
   * @property {string[]} errors - Array of error messages if validation failed
   */
  errors: string[];

  /**
   * @property {string[]} warnings - Array of warning messages for potential issues
   */
  warnings: string[];
}
