import { DIDStringValidator } from './DIDStringValidator.js';
import { IDIDStringBuilder } from '../../interfaces/did-string/IDIDStringBuilder.js';

/**
 * @class DIDStringBuilder
 * @description Builder class for constructing DID strings according to the W3C DID specification format:
 * did:method:methodSpecificIdentifier?param=value#fragment
 */
export class DIDStringBuilder implements IDIDStringBuilder {
  /**
   * @private
   * @property {string} method - The DID method (e.g., "key", "web", "ion").
   */
  private method: string;

  /**
   * @private
   * @property {string | null} methodSpecificIdentifier - The method-specific identifier part of the DID.
   */
  private methodSpecificIdentifier: string | null = null;

  /**
   * @private
   * @property {string | null} path - The path component of the DID URL.
   */
  private path: string | null = null;

  /**
   * @private
   * @property {Map<string, string>} parameters - Map of DID parameters and their values.
   */
  private parameters: Map<string, string> = new Map();

  /**
   * @private
   * @property {string | null} fragment - The fragment component of the DID URL.
   */
  private fragment: string | null = null;

  /**
   * @private
   * @constructor
   * @param {string} method - The DID method to use.
   * @throws {Error} If the method is null or empty.
   * @description Private constructor enforces the use of the static factory method.
   */
  private constructor(method: string) {
    if (!method) {
      throw new Error('DID method cannot be null or empty');
    }
    this.method = method;
  }

  /**
   * @static
   * @method create
   * @param {string} method - The DID method to use.
   * @returns {DIDStringBuilder} A new instance of DIDStringBuilder.
   * @description Static factory method for creating builder instances.
   */
  static create(method: string): DIDStringBuilder {
    return new DIDStringBuilder(method);
  }

  /**
   * @method withMethodSpecificIdentifier
   * @param {string} identifier - The method-specific identifier for the DID.
   * @returns {DIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Sets the method-specific identifier part of the DID.
   */
  withMethodSpecificIdentifier(identifier: string): DIDStringBuilder {
    this.methodSpecificIdentifier = identifier;
    return this;
  }

  /**
   * @method withPath
   * @param {string} path - The path component for the DID URL.
   * @returns {DIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Sets the path component of the DID URL.
   */
  withPath(path: string): DIDStringBuilder {
    this.path = path.startsWith('/') ? path : `/${path}`;
    return this;
  }

  /**
   * @method withParameter
   * @param {string} name - The name of the parameter.
   * @param {string} value - The value of the parameter.
   * @returns {DIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Adds a parameter to the DID URL.
   */
  withParameter(name: string, value: string): DIDStringBuilder {
    this.parameters.set(name, value);
    return this;
  }

  /**
   * @method withFragment
   * @param {string} fragment - The fragment component for the DID URL.
   * @returns {DIDStringBuilder} The builder instance, allowing for method chaining.
   * @description Sets the fragment component of the DID URL.
   */
  withFragment(fragment: string): DIDStringBuilder {
    this.fragment = fragment;
    return this;
  }

  /**
   * @method build
   * @returns {string} The constructed DID string.
   * @throws {Error} If the resulting DID is invalid according to the DID specification.
   * @description Builds and returns the final DID string, performing validation before returning.
   */
  build(): string {
    let did = `did:${this.method}`;

    // Add method specific id
    if (this.methodSpecificIdentifier) {
      did += `:${this.methodSpecificIdentifier}`;
    }

    // Add path
    if (this.path) {
      did += this.path;
    }

    // Add parameters
    if (this.parameters.size > 0) {
      const paramsString = Array.from(this.parameters.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      did += `?${paramsString}`;
    }

    // Add fragments
    if (this.fragment) {
      did += `#${this.fragment}`;
    }

    if (!DIDStringValidator.isValidDID(did)) {
      throw new Error(`Invalid DID: ${did}`);
    }

    return did;
  }
}
