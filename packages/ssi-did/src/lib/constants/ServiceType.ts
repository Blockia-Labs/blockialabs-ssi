/**
 * @file Defines the ServiceType enum used in Decentralized Identity (DID) documents.
 * @module ServiceType
 */

/**
 * @enum {string} ServiceType
 * @description Comprehensive enumeration of service types that can be associated with a Decentralized Identifier (DID) Document.
 *
 * These service types represent standardized mechanisms for extending the functionality of DIDs beyond
 * simple identification, enabling a wide range of interactions, communications, and verifiable credential
 * management in the decentralized identity ecosystem.
 *
 * IMPORTANT: This enum reflects known service types from DID Core specifications and community standards.
 * The decentralized identity landscape is rapidly evolving, and new service types may emerge. Always
 * consult the most recent DID Specification Registries and W3C recommendations for the most up-to-date
 * and authoritative information on service type definitions.
 */
export enum ServiceType {
  /**
   * @description Represents a service that establishes verifiable connections between a DID and associated
   * web domains. This service type enables cryptographic proof of domain ownership and provides a mechanism
   * for bridging decentralized identifiers with traditional web infrastructure.
   *
   * Enables robust domain verification, allowing entities to prove their digital identity across
   * web platforms through a cryptographically secure method.
   *
   * @example A corporate DID that links to its official website, allowing independent verification
   * of the organization's digital identity through domain ownership proofs.
   */
  LinkedDomains = 'LinkedDomains',

  /**
   * @description A service dedicated to handling and processing linked verifiable presentations.
   * This service type facilitates the secure exchange, verification, and validation of
   * presentation packages containing multiple verifiable credentials.
   *
   * Provides a standardized mechanism for presenting, sharing, and cryptographically verifying
   * collections of credentials across different systems and platforms.
   *
   * @example An educational institution's DID service that allows students to compile and
   * present a comprehensive set of academic credentials for job applications.
   */
  LinkedVerifiablePresentation = 'LinkedVerifiablePresentation',

  /**
   * @description Implements the DIDComm messaging protocol, a secure, privacy-preserving communication
   * mechanism designed specifically for decentralized identity interactions.
   *
   * Enables end-to-end encrypted, peer-to-peer messaging that leverages the cryptographic
   * capabilities of DIDs to ensure secure, private communication channels.
   *
   * @example A decentralized healthcare communication system where patients and providers
   * can exchange sensitive information using DID-based secure messaging.
   */
  DIDCommMessaging = 'DIDCommMessaging',

  /**
   * @description Represents a service interface for interacting with a Web of Things (WoT) Thing,
   * enabling direct integration of physical or virtual devices with decentralized identity systems.
   *
   * Provides a standardized method for device identification, authentication, and interaction
   * using decentralized identity principles.
   *
   * @example A smart home system where each IoT device has a unique DID, allowing secure,
   * granular access control and authentication for device interactions.
   */
  WotThing = 'WotThing',

  /**
   * @description A discovery service for Web of Things (WoT) devices, enabling dynamic
   * registration, discovery, and interaction within IoT ecosystems using decentralized identifiers.
   *
   * Facilitates automated device discovery, registration, and secure interaction protocols
   * in distributed IoT networks.
   *
   * @example A smart city infrastructure where IoT devices can automatically discover and
   * securely interact with each other using a standardized WoT directory service.
   */
  WotDirectory = 'WotDirectory',

  /**
   * @description A comprehensive service for managing the lifecycle of verifiable credentials,
   * including issuance, verification, revocation, and suspension mechanisms.
   *
   * Provides a centralized yet decentralized approach to credential management, ensuring
   * the integrity and traceability of issued credentials.
   *
   * @example A national identity system where credentials can be dynamically issued,
   * verified, and revoked while maintaining cryptographic proof of their authenticity.
   */
  CredentialRegistry = 'CredentialRegistry',

  /**
   * @description Implements OpenID Connect protocol for verifiable credential issuance,
   * bridging traditional authentication frameworks with decentralized identity technologies.
   *
   * Enables standardized, interoperable credential issuance processes that leverage
   * both OpenID Connect and decentralized identity principles.
   *
   * @example A government agency issuing digital identity credentials that can be
   * verified across multiple platforms and service providers.
   */
  OpenID4VerifiableCredentialIssuance = 'OpenID4VerifiableCredentialIssuance',

  /**
   * @description Supports OpenID Connect protocol for verifiable presentation verification,
   * creating a standardized mechanism for credential presentation and validation.
   *
   * Provides a secure, interoperable framework for presenting and validating
   * credentials using widely adopted authentication standards.
   *
   * @example An online service that allows users to prove their identity or
   * qualifications using verifiable credentials from multiple issuers.
   */
  OpenID4VerifiablePresentation = 'OpenID4VerifiablePresentation',
}
