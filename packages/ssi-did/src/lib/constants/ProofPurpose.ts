/**
 * @file Defines the ProofPurpose enum used in Decentralized Identity (DID) documents.
 * @module ProofPurpose
 */

/**
 * @enum {string} ProofPurpose
 * @description Comprehensive enumeration of verification method purposes within a Decentralized Identifier (DID) Document.
 * These purposes define the specific cryptographic contexts and authorization mechanisms for different
 * types of interactions and verifications related to a DID. Each purpose represents a distinct
 * verification method that enables different security and authentication capabilities in the decentralized identity ecosystem.
 *
 * IMPORTANT: This enum is derived from the DID Core specification and represents the standard verification
 * method purposes. However, the specific implementation may vary across different DID methods and implementations.
 * Always refer to the most recent DID Specification Registries for the most authoritative and up-to-date information.
 */
export enum ProofPurpose {
  /**
   * @description Represents the primary authentication verification method for proving control and ownership of a DID.
   * This purpose is used to cryptographically verify that the entity presenting the DID is indeed the legitimate
   * controller of the identifier. It enables secure authentication mechanisms where the DID subject can
   * prove their identity through cryptographic proofs, typically involving digital signatures or
   * other challenge-response protocols.
   *
   * @example An authentication flow where a user proves ownership of their DID by signing a challenge
   * with a key specified in the authentication section of their DID Document.
   */
  Authentication = 'authentication',

  /**
   * @description Indicates a verification method specifically designed for making verifiable assertions
   * and statements on behalf of the DID subject. This purpose allows the creation of cryptographically
   * signed statements, claims, or representations that can be independently verified as originating
   * from the legitimate controller of the DID.
   *
   * @example A DID subject using their assertion method to digitally sign a professional certification
   * or academic credential, proving the statement's authenticity and origin.
   */
  AssertionMethod = 'assertionMethod',

  /**
   * @description A verification method dedicated to establishing secure, encrypted communication channels
   * and negotiating shared cryptographic keys between parties. This purpose enables privacy-preserving
   * key agreement protocols that allow secure message exchange and mutual authentication without
   * revealing sensitive cryptographic material.
   *
   * @example Using a key agreement method to establish an encrypted communication channel in a
   * decentralized messaging system, allowing parties to negotiate a shared secret without direct key exposure.
   */
  KeyAgreement = 'keyAgreement',

  /**
   * @description Represents a verification method specifically for directly invoking and executing
   * capabilities associated with the DID subject. This purpose allows the DID controller to authorize
   * specific actions, trigger automated processes, or enable programmatic interactions that require
   * cryptographic proof of authorization.
   *
   * @example A smart contract system where a DID can invoke specific capabilities, such as
   * authorizing a financial transaction or triggering a complex multi-step workflow.
   */
  CapabilityInvocation = 'capabilityInvocation',

  /**
   * @description A sophisticated verification method that enables the controlled and cryptographically
   * verifiable delegation of capabilities from the primary DID subject to other entities. This purpose
   * supports complex authorization models where rights and permissions can be securely transferred
   * or sub-delegated while maintaining a verifiable chain of authorization.
   *
   * @example Creating a hierarchical access control system where a primary DID can delegate specific
   * administrative rights to subordinate DIDs, with each delegation cryptographically verifiable.
   */
  CapabilityDelegation = 'capabilityDelegation',
}
