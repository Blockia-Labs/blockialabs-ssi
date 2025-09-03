/**
 * @interface IDIDStringBuilder
 * @description Interface for the DIDStringBuilder class, defining the contract for building DID strings.
 */
export interface IDIDStringBuilder {
  /**
   * @method withMethodSpecificIdentifier
   * @param {string} identifier - The method-specific identifier for the DID.
   * @returns {IDIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Sets the method-specific identifier part of the DID.
   */
  withMethodSpecificIdentifier(identifier: string): IDIDStringBuilder;

  /**
   * @method withPath
   * @param {string} path - The path component for the DID URL.
   * @returns {IDIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Sets the path component of the DID URL.
   */
  withPath(path: string): IDIDStringBuilder;

  /**
   * @method withParameter
   * @param {string} name - The name of the parameter.
   * @param {string} value - The value of the parameter.
   * @returns {IDIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Adds a parameter to the DID URL.
   */
  withParameter(name: string, value: string): IDIDStringBuilder;

  /**
   * @method withFragment
   * @param {string} fragment - The fragment component for the DID URL.
   * @returns {IDIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Sets the fragment component of the DID URL.
   */
  withFragment(fragment: string): IDIDStringBuilder;

  /**
   * @method build
   * @returns {string} The constructed DID string.
   * @throws {Error} If the resulting DID is invalid according to the DID specification.
   * @description Builds and returns the final DID string, performing validation before returning.
   */
  build(): string;
}
