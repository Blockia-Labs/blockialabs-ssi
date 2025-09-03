'use strict';
import { DIDDocumentVerifier } from '../../core/did-document/DIDDocumentVerifier.js';
import { IDIDDocument } from '../../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentBuilder } from '../../interfaces/did-document/IDIDDocumentBuilder.js';
import { ILinkedResource } from '../../interfaces/did-document/ILinkedResource.js';
import { IProof } from '../../interfaces/did-document/IProof.js';
import { IService } from '../../interfaces/did-document/IService.js';
import { IVerificationMethod } from '../../interfaces/did-document/IVerificationMethod.js';

/**
 * @class DIDDocumentBuilder
 * @implements {IDIDDocumentBuilder}
 * @description Robust implementation of the IDIDDocumentBuilder interface, providing comprehensive
 * validation and flexibility for constructing DID documents with support for post-creation updates.
 */
export class DIDDocumentBuilder implements IDIDDocumentBuilder {
  /**
   * @private
   * @property {Partial<IDIDDocument>} document - Private instance used to build the DID document.
   */
  private document: Partial<IDIDDocument> = {};

  /**
   * @private
   * @property {boolean} isSealed - Indicates if the document has been sealed (made immutable).
   */
  private isSealed = false;

  /**
   * @private
   * @constructor
   * @param {string} did - The DID of the document to be built.
   * @description Private constructor enforces the use of the static factory method (create). Sets the
   * default context and DID for the document.
   */
  private constructor(did: string) {
    this.document['@context'] = 'https://www.w3.org/ns/did/v1';
    this.document.id = did;
  }

  /**
   * @readonly
   * @property {Readonly<Partial<IDIDDocument>>} - returns a read only copy of the document being built
   */
  get documentReadOnly(): Readonly<Partial<IDIDDocument>> {
    return { ...this.document };
  }

  /**
   * @static
   * @method create
   * @param {string} did - The DID of the document to be built.
   * @returns {IDIDDocumentBuilder} A new instance of the DIDDocumentBuilder.
   * @description Static factory method for creating builder instances.
   */
  static create(did: string): IDIDDocumentBuilder {
    return new DIDDocumentBuilder(did);
  }

  /**
   * @method clone
   * @returns {IDIDDocumentBuilder} A new builder instance with a deep copy of the current document.
   * @description Creates a new builder with a deep copy of the current document state.
   * Useful for creating variants of a document without modifying the original.
   */
  clone(): IDIDDocumentBuilder {
    const clonedBuilder = new DIDDocumentBuilder(this.document.id as string);
    clonedBuilder.document = JSON.parse(JSON.stringify(this.document));
    return clonedBuilder;
  }

  /**
   * @method withContext
   * @param {string | string[]} context - The JSON-LD context(s) for the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @throws {Error} If the context is invalid (null, undefined, or an empty array).
   * @description Sets the JSON-LD context for the DID document, validating that the context is
   * a non-empty string or array.
   */
  withContext(
    context: string | string[] | (string | Record<string, unknown>)[],
  ): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    if (!context || (Array.isArray(context) && context.length === 0)) {
      throw new Error('Context must be a non-empty string or array');
    }
    this.document['@context'] = context;
    return this;
  }

  /**
   * @method withId
   * @param {string} did - The DID of the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @throws {Error} If the DID is invalid (null, undefined, or does not start with "did:").
   * @description Sets the DID for the DID document, validating that the DID has a valid format.
   */
  withId(did: string): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    if (!did || !did.startsWith('did:')) {
      throw new Error('Invalid DID format');
    }
    this.document.id = did;
    return this;
  }

  /**
   * @method withAlsoKnownAs
   * @param {string[]} identifiers - Alternative identifiers for the DID.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @throws {Error} If the identifiers are not an array.
   * @description Sets the alternative identifiers for the DID, validating that the identifiers are
   * provided as an array.
   */
  withAlsoKnownAs(identifiers: string[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    if (!Array.isArray(identifiers)) {
      throw new Error('AlsoKnownAs must be an array of strings');
    }
    this.document.alsoKnownAs = identifiers;
    return this;
  }

  /**
   * @method withController
   * @param {string | string[]} controller - The DID(s) of the controller(s) of the DID.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the controller(s) for the DID.
   */
  withController(controller: string | string[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.controller = controller;
    return this;
  }

  /**
   * @method withVerificationMethod
   * @param {IVerificationMethod[]} methods - An array of verification methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the verification methods for the DID document.
   */
  withVerificationMethod(methods: IVerificationMethod[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.verificationMethod = methods;
    return this;
  }

  /**
   * @method withAuthentication
   * @param {(IVerificationMethod | string)[]} methods - An array of authentication methods (can be
   *        IVerificationMethod objects or DID URLs).
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the authentication methods for the DID document.
   */
  withAuthentication(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.authentication = methods;
    return this;
  }

  /**
   * @method withAssertionMethod
   * @param {(IVerificationMethod | string)[]} methods - An array of assertion methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the assertion methods for the DID document.
   */
  withAssertionMethod(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.assertionMethod = methods;
    return this;
  }

  /**
   * @method withKeyAgreement
   * @param {(IVerificationMethod | string)[]} methods - An array of key agreement methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the key agreement methods for the DID document.
   */
  withKeyAgreement(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.keyAgreement = methods;
    return this;
  }

  /**
   * @method withCapabilityInvocation
   * @param {(IVerificationMethod | string)[]} methods - An array of capability invocation methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the capability invocation methods for the DID document.
   */
  withCapabilityInvocation(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.capabilityInvocation = methods;
    return this;
  }

  /**
   * @method withCapabilityDelegation
   * @param {(IVerificationMethod | string)[]} methods - An array of capability delegation methods.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the capability delegation methods for the DID document.
   */
  withCapabilityDelegation(methods: (IVerificationMethod | string)[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.capabilityDelegation = methods;
    return this;
  }

  /**
   * @method withServices
   * @param {IService[]} services - An array of service endpoints.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the service endpoints for the DID document.
   */
  withServices(services: IService[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.service = services;
    return this;
  }

  /**
   * @method withLinkedResources
   * @param {ILinkedResource[]} resources - An array of linked resources.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the linked resources for the DID document.
   */
  withLinkedResources(resources: ILinkedResource[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.linkedResource = resources;
    return this;
  }

  /**
   * @method withProof
   * @param {IProof | IProof[]} proof - The cryptographic proof for the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @throws {Error} If the document has been sealed and is immutable.
   * @description Sets the proof for the DID document. Can be called even after build() if the document
   * hasn't been sealed.
   */
  withProof(proof: IProof | IProof[]): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.proof = proof;
    return this;
  }

  /**
   * @method addProof
   * @param {IProof} proof - The cryptographic proof to add to the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @throws {Error} If the document has been sealed and is immutable.
   * @description Adds a proof to the DID document, converting single proof to an array if needed.
   * Designed specifically for the two-step DID document generation process.
   */
  addProof(proof: IProof): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }

    if (!this.document.proof) {
      this.document.proof = proof;
    } else if (Array.isArray(this.document.proof)) {
      this.document.proof.push(proof);
    } else {
      this.document.proof = [this.document.proof, proof];
    }

    return this;
  }

  /**
   * @method withDNSValidationDomain
   * @param {string} domain - The DNS validation domain for the DID document.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @description Sets the DNS validation domain for the DID document.
   */
  withDNSValidationDomain(domain: string): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }
    this.document.dnsValidationDomain = domain;
    return this;
  }

  /**
   * @method withAdditionalProperty
   * @param {string} key - The property key to add to the DID document.
   * @param {unknown} value - The value for the property.
   * @returns {IDIDDocumentBuilder} The builder instance, allowing for method chaining.
   * @throws {Error} If the document has been sealed and is immutable.
   * @description Adds an arbitrary property to the DID document, enabling extension with
   * method-specific or custom properties not defined in the core specification.
   */
  withAdditionalProperty(key: string, value: unknown): IDIDDocumentBuilder {
    if (this.isSealed) {
      throw new Error('Document is sealed and cannot be modified');
    }

    if (!key || typeof key !== 'string') {
      throw new Error('Property key must be a non-empty string');
    }

    this.document[key] = value;
    return this;
  }

  /**
   * @method build
   * @returns {IDIDDocument} The constructed DID document.
   * @description Builds and returns the DID document, performing validation before construction.
   * The document remains mutable for further updates like adding proofs.
   */
  build(): IDIDDocument {
    const verificationResult = DIDDocumentVerifier.verify(this.document as IDIDDocument);

    if (!verificationResult.valid) {
      const errorMessage = `Invalid DID Document: ${verificationResult.errors.join('; ')}`;
      throw new Error(errorMessage);
    }

    if (verificationResult.warnings.length > 0) {
      console.warn('DID Document warnings:', verificationResult.warnings);
    }

    return this.document as IDIDDocument;
  }

  /**
   * @method buildAndSeal
   * @returns {IDIDDocument} The constructed and immutable DID document.
   * @description Builds and returns a final, immutable DID document. After this operation,
   * the builder cannot be used to further modify the document.
   */
  buildAndSeal(): IDIDDocument {
    const verificationResult = DIDDocumentVerifier.verify(this.document as IDIDDocument);

    if (!verificationResult.valid) {
      const errorMessage = `Invalid DID Document: ${verificationResult.errors.join('; ')}`;
      throw new Error(errorMessage);
    }

    if (verificationResult.warnings.length > 0) {
      console.warn('DID Document warnings:', verificationResult.warnings);
    }

    this.isSealed = true;
    const document = this.document as IDIDDocument;
    Object.freeze(document);
    return document;
  }
}
