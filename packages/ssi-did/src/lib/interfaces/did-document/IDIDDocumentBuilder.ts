import { IDIDDocument } from './IDIDDocument.js';
import { ILinkedResource } from './ILinkedResource.js';
import { IProof } from './IProof.js';
import { IService } from './IService.js';
import { IVerificationMethod } from './IVerificationMethod.js';

/**
 * @interface IDIDDocumentBuilder
 * @description Interface defining the contract for a DID Document Builder. This builder provides a
 * type-safe, fluent interface for constructing DID documents, ensuring that the resulting document
 * conforms to the expected structure and contains the required information.
 */
export interface IDIDDocumentBuilder {
  /**
   * @readonly
   * @property {Readonly<Partial<IDIDDocument>>} documentReadOnly - get read only document for current builder
   * @description returns a read only document that is being built
   */
  readonly documentReadOnly: Readonly<Partial<IDIDDocument>>;

  /**
   * @method withContext
   * @param {string | string[] | (string | Record<string, unknown>)[]} context - The JSON-LD context(s) for the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the JSON-LD context for the DID document.
   */
  withContext(
    context: string | string[] | (string | Record<string, unknown>)[],
  ): IDIDDocumentBuilder;

  /**
   * @method withId
   * @param {string} did - The DID of the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the DID for the DID document.
   */
  withId(did: string): IDIDDocumentBuilder;

  /**
   * @method withAlsoKnownAs
   * @param {string[]} identifiers - Alternative identifiers for the DID.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the alternative identifiers for the DID.
   */
  withAlsoKnownAs(identifiers: string[]): IDIDDocumentBuilder;

  /**
   * @method withController
   * @param {string | string[]} controller - The DID(s) of the controller(s) of the DID.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the controller(s) for the DID.
   */
  withController(controller: string | string[]): IDIDDocumentBuilder;

  /**
   * @method withVerificationMethod
   * @param {IVerificationMethod[]} methods - An array of verification methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the verification methods for the DID document.
   */
  withVerificationMethod(methods: IVerificationMethod[]): IDIDDocumentBuilder;

  /**
   * @method withAuthentication
   * @param {(IVerificationMethod | string)[]} methods - An array of authentication methods (can be
   *        IVerificationMethod objects or DID URLs).
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the authentication methods for the DID document.
   */
  withAuthentication(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder;

  /**
   * @method withAssertionMethod
   * @param {(IVerificationMethod | string)[]} methods - An array of assertion methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the assertion methods for the DID document.
   */
  withAssertionMethod(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder;

  /**
   * @method withKeyAgreement
   * @param {(IVerificationMethod | string)[]} methods - An array of key agreement methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the key agreement methods for the DID document.
   */
  withKeyAgreement(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder;

  /**
   * @method withCapabilityInvocation
   * @param {(IVerificationMethod | string)[]} methods - An array of capability invocation methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the capability invocation methods for the DID document.
   */
  withCapabilityInvocation(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder;

  /**
   * @method withCapabilityDelegation
   * @param {(IVerificationMethod | string)[]} methods - An array of capability delegation methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the capability delegation methods for the DID document.
   */
  withCapabilityDelegation(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder;

  /**
   * @method withServices
   * @param {IService[]} services - An array of service endpoints.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the service endpoints for the DID document.
   */
  withServices(services: IService[]): IDIDDocumentBuilder;

  /**
   * @method withLinkedResources
   * @param {ILinkedResource[]} resources - An array of linked resources.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the linked resources for the DID document.
   */
  withLinkedResources(resources: ILinkedResource[]): IDIDDocumentBuilder;

  /**
   * @method withProof
   * @param {IProof | IProof[]} proof - The cryptographic proof for the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the proof for the DID document.
   */
  withProof(proof: IProof | IProof[]): IDIDDocumentBuilder;

  /**
   * @method addProof
   * @param {IProof} proof - The cryptographic proof to add to the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Adds a proof to the DID document, converting single proof to an array if needed.
   * Designed specifically for the two-step DID document generation process.
   */
  addProof(proof: IProof): IDIDDocumentBuilder;

  /**
   * @method withDNSValidationDomain
   * @param {string} domain - The DNS validation domain for the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the DNS validation domain for the DID document.
   */
  withDNSValidationDomain(domain: string): IDIDDocumentBuilder;

  /**
   * @method withAdditionalProperty
   * @param {string} key - The property key to add to the DID document.
   * @param {unknown} value - The value for the property.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @throws {Error} If the document has been sealed and is immutable.
   * @description Adds an arbitrary property to the DID document, enabling extension with
   * method-specific or custom properties not defined in the core specification.
   */
  withAdditionalProperty(key: string, value: unknown): IDIDDocumentBuilder;

  /**
   * @method clone
   * @returns {IDIDDocumentBuilder} A new builder instance with a deep copy of the current document.
   * @description Creates a new builder with a deep copy of the current document state.
   * Useful for creating variants of a document without modifying the original.
   */
  clone(): IDIDDocumentBuilder;

  /**
   * @method build
   * @returns {IDIDDocument} The constructed DID document.
   * @description Builds and returns the final DID document, performing validation before construction.
   * The document remains mutable for further updates like adding proofs.
   */
  build(): IDIDDocument;

  /**
   * @method buildAndSeal
   * @returns {IDIDDocument} The constructed and immutable DID document.
   * @description Builds and returns a final, immutable DID document. After this operation,
   * the builder cannot be used to further modify the document.
   */
  buildAndSeal(): IDIDDocument;
}
