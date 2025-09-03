import { ILinkedResource } from './ILinkedResource.js';
import { IProof } from './IProof.js';
import { IService } from './IService.js';
import { IVerificationMethod } from './IVerificationMethod.js';

/**
 * @file Defines the IDIDDocument interface, representing a DID Document according to W3C DID Core 1.0.
 * @module IDIDDocument
 */

/**
 * @interface IDIDDocument
 * @description Comprehensive interface representing a Decentralized Identifier (DID) Document,
 * which serves as the authoritative description of a decentralized digital identity.
 *
 * This interface encapsulates the complete structure of a DID Document as defined by the W3C DID Core 1.0 specification,
 * providing a robust, extensible model for representing decentralized identities across various implementation methods.
 *
 * Key Characteristics:
 * - Provides a machine-readable representation of a DID's core attributes
 * - Supports multiple verification methods and relationships
 * - Enables service endpoint discovery
 * - Supports JSON-LD context for semantic interoperability
 *
 * Conformance:
 * - Adheres to W3C DID Core 1.0 specification
 * - Compatible with DID Specification Registries
 * - Supports extensibility through optional properties
 *
 * IMPORTANT: Implementations should validate documents against the latest W3C specifications
 * and specific DID method requirements.
 */
export interface IDIDDocument {
  /**
   * @property {'@context'}
   * @type {string | string[] | (string | Record<string, any>)[]}
   * @description JSON-LD context providing semantic interpretation for the DID document.
   *
   * The context enables semantic interoperability by defining how to interpret the document's
   * properties across different systems and implementations.
   *
   * According to W3C DID Core 1.0, the JSON-LD Context is either a string, a list of strings,
   * or a list containing any combination of strings and/or ordered maps.
   *
   * @example
   * - Single context: "https://www.w3.org/ns/did/v1"
   * - Multiple contexts: ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/v1"]
   * - Mixed contexts: ["https://www.w3.org/ns/did/v1", { "@base": "did:example:123" }]
   */
  '@context': string | string[] | (string | Record<string, unknown>)[];

  /**
   * @property {'id'}
   * @type {string}
   * @description Unique identifier for the DID subject, conforming to universal DID syntax rules.
   *
   * Represents the primary identifier for the decentralized digital identity,
   * ensuring global uniqueness and method-specific compatibility.
   *
   * @example
   * - "did:example:123456789abcdefghi"
   * - "did:key:z6MkrabhZvJsnu9gXkA8cXVkKPPB3ZhPD4QfUNHq8dxRsAmn"
   */
  'id': string;

  /**
   * @property {'alsoKnownAs'}
   * @type {string[] | undefined}
   * @optional
   * @description Alternative identifiers or representations associated with the DID subject.
   *
   * Provides additional context and discoverability by linking the DID to other
   * known identifiers or resources.
   *
   * @example
   * - ["https://example.com/profile", "mailto:user@example.com"]
   */
  'alsoKnownAs'?: string[];

  /**
   * @property {'controller'}
   * @type {string | string[] | undefined}
   * @optional
   * @description DIDs authorized to control this identity, enabling complex ownership and delegation models.
   *
   * Supports scenarios with multiple controllers or hierarchical identity management,
   * allowing flexible authorization and governance.
   *
   * @example
   * - Single controller: "did:example:controller"
   * - Multiple controllers: ["did:example:controller1", "did:example:controller2"]
   */
  'controller'?: string | string[];

  /**
   * @property {'verificationMethod'}
   * @type {IVerificationMethod[] | undefined}
   * @optional
   * @description Comprehensive set of cryptographic verification methods associated with the DID.
   *
   * Defines the cryptographic keys and methods used for various authentication
   * and verification purposes within the decentralized identity ecosystem.
   */
  'verificationMethod'?: IVerificationMethod[];

  /**
   * @property {'authentication'}
   * @type {(IVerificationMethod | string)[] | undefined}
   * @optional
   * @description Methods specifically designated for authenticating the DID subject.
   *
   * Provides a mechanism to prove control and ownership of the decentralized identity
   * through cryptographic authentication mechanisms.
   */
  'authentication'?: (IVerificationMethod | string)[];

  /**
   * @property {'assertionMethod'}
   * @type {(IVerificationMethod | string)[] | undefined}
   * @optional
   * @description Methods authorized to make verifiable assertions on behalf of the DID subject.
   *
   * Enables the creation of cryptographically verifiable claims and credentials
   * that can be independently validated.
   */
  'assertionMethod'?: (IVerificationMethod | string)[];

  /**
   * @property {'keyAgreement'}
   * @type {(IVerificationMethod | string)[] | undefined}
   * @optional
   * @description Methods used for establishing secure, encrypted communication channels.
   *
   * Facilitates privacy-preserving key negotiation and secure message exchange
   * between decentralized identity holders.
   */
  'keyAgreement'?: (IVerificationMethod | string)[];

  /**
   * @property {'capabilityInvocation'}
   * @type {(IVerificationMethod | string)[] | undefined}
   * @optional
   * @description Methods authorized to directly invoke capabilities associated with the DID.
   *
   * Supports programmatic authorization and execution of specific actions
   * tied to the decentralized identity.
   */
  'capabilityInvocation'?: (IVerificationMethod | string)[];

  /**
   * @property {'capabilityDelegation'}
   * @type {(IVerificationMethod | string)[] | undefined}
   * @optional
   * @description Methods enabling the delegation of capabilities to other entities.
   *
   * Allows for sophisticated, granular access control and authorization
   * models within decentralized systems.
   */
  'capabilityDelegation'?: (IVerificationMethod | string)[];

  /**
   * @property {'service'}
   * @type {IService[] | undefined}
   * @optional
   * @description Service endpoints associated with the DID, enabling discovery and interaction.
   *
   * Provides a mechanism for describing and discovering services related
   * to the decentralized identity.
   */
  'service'?: IService[];

  /**
   * @property {'proof'}
   * @type {IProof | IProof[] | undefined}
   * @optional
   * @description Cryptographic proof for verifying the authenticity and integrity of the entire DID document.
   *
   * Provides a cryptographic mechanism to ensure the DID document's authenticity,
   * integrity, and non-repudiation.
   *
   * The proof allows verification that:
   * - The document has not been tampered with
   * - The document was created by the claimed controller
   * - The document's contents can be cryptographically validated
   *
   * @remarks
   * This proof is crucial for:
   * - Establishing document provenance
   * - Preventing unauthorized modifications
   * - Enabling trustless verification of DID documents
   *
   * @example
   * {
   *   type: 'EcdsaSecp256k1Signature2019',
   *   verificationMethod: 'did:example:123#key-1',
   *   created: '2023-10-15T10:30:00Z',
   *   proofPurpose: 'authentication',
   *   jws: 'eyJhbGciOiJFUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19...'
   * }
   *
   * @see {@link https://www.w3.org/TR/vc-data-model/#proofs-signatures |W3C Verifiable Credentials Data Model}
   */
  'proof'?: IProof | IProof[];

  /**
   * @property {'dnsValidationDomain'}
   * @type {string | undefined}
   * @optional
   * @description DNS domain used for additional validation in certain DID methods.
   *
   * Supports method-specific validation mechanisms that require DNS verification.
   */
  'dnsValidationDomain'?: string;

  /**
   * @property {'linkedResource'}
   * @type {ILinkedResource[] | undefined}
   * @optional
   * @description Additional resources cryptographically associated with the DID.
   *
   * Enables the attachment of supplementary resources and metadata
   * to the decentralized identity.
   */
  'linkedResource'?: ILinkedResource[];

  /**
   * @description Allows for additional properties not specified in the interface.
   * This accommodates method-specific extensions and future additions to the DID Core specification.
   */
  [key: string]: unknown;
}
