import { ProofPurpose } from '../../constants/ProofPurpose.js';

/**
 * @file Defines the Proof interface used in Decentralized Identity (DID) documents.
 * @module Proof
 */

/**
 * @interface Proof
 * @description Comprehensive interface representing a cryptographic proof for Decentralized Identifiers (DIDs).
 *
 * Provides a robust, standardized mechanism for creating and verifying cryptographic proofs
 * that demonstrate the authenticity, integrity, and provenance of DID documents or specific
 * data associated with a decentralized identity.
 *
 * Key Characteristics:
 * - Supports multiple cryptographic signature types
 * - Enables verification of document authenticity
 * - Provides comprehensive metadata about the proof
 * - Supports security mechanisms against replay attacks
 *
 * Designed to be fully compliant with W3C Decentralized Identifier (DID) specifications
 * and cryptographic best practices.
 */
export interface IProof {
  /**
   * @property {'id'}
   * @type {string}
   * @description Unique identifier of the entity creating the proof (typically a DID).
   *
   * Provides a verifiable reference to the proof's creator, enabling traceability
   * and accountability in the decentralized identity ecosystem.
   *
   * @example
   * - "did:example:123456789abcdefghi"
   * - "did:key:z6MkrabhZvJsnu9gXkA8cXVkKPPB3ZhPD4QfUNHq8dxRsAmn"
   */
  id: string;

  /**
   * @property {'type'}
   * @type {string}
   * @description Cryptographic signature type and algorithm used to create the proof.
   *
   * Specifies the precise cryptographic mechanism used for generating the signature,
   * ensuring compatibility and interoperability across different systems.
   *
   * @example
   * - "JsonWebSignature2020"

   * - "EcdsaSecp256k1Signature2019"
   */
  type: string;

  /**
   * @property {'created'}
   * @type {string}
   * @description Timestamp indicating the exact moment the proof was generated.
   *
   * Provides a precise temporal context for the proof, enabling chronological
   * verification and establishing the proof's temporal validity.
   *
   * @example
   * - "2023-07-15T22:45:11Z"
   * - "2024-01-20T14:30:00.123Z"
   */
  created: string;

  /**
   * @property {'proofValue'}
   * @type {string}
   * @description The actual cryptographic signature generated for the DID document.
   *
   * Contains the raw signature value, computed by signing the canonicalized hash
   * of the DID document, ensuring its integrity and authenticity.
   *
   * @example
   * - "MEUCIQDjUFf9..."
   */
  proofValue: string;

  /**
   * @property {'proofPurpose'}
   * @type {ProofPurpose}
   * @description The specific purpose or context for which the proof was generated.
   *
   * Defines the intended use of the proof, constraining its applicability
   * to specific verification relationships defined in the DID document.
   *
   * @example
   * - ProofPurpose.Authentication
   * - ProofPurpose.AssertionMethod
   * - ProofPurpose.CapabilityDelegation
   */
  proofPurpose: ProofPurpose;

  /**
   * @property {'verificationMethod'}
   * @type {string}
   * @description Identifier of the specific verification method used to validate the proof.
   *
   * References a precise verification method (such as a public key) within
   * the DID document, enabling granular cryptographic validation.
   *
   * @example
   * - "#key1"
   * - "did:example:123#verificationKey"
   */
  verificationMethod: string;

  /**
   * @property {'domain'}
   * @type {string | undefined}
   * @optional
   * @description Contextual domain or environment associated with the proof.
   *
   * Provides additional scoping information to prevent cross-context
   * misuse of the proof and enhance security boundaries.
   *
   * @example
   * - "example.com"
   * - "authentication.service.org"
   */
  domain?: string;

  /**
   * @property {'challenge'}
   * @type {string | undefined}
   * @optional
   * @description Unique challenge value to prevent replay attacks.
   *
   * Introduces a dynamic, transaction-specific element to ensure
   * each proof is unique and cannot be reused.
   *
   * @example
   * - "a3f146f1-7aef-4715-b07d-20f14d"
   * - "nonce-2023-07-15T22:45:11Z"
   */
  challenge?: string;

  /**
   * @property {'nonce'}
   * @type {string | undefined}
   * @optional
   * @description Random value to enhance proof uniqueness and prevent replay attacks.
   *
   * Provides an additional layer of protection against potential
   * cryptographic replay or reuse of signatures.
   *
   * @example
   * - "randomString123"
   * - "0x1a2b3c4d5e6f"
   */
  nonce?: string;
}
