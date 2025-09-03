/**
 * @file Defines the ILinkedResource interface, representing a linked resource associated with a DID document.
 * @module ILinkedResource
 */

/**
 * @interface ILinkedResource
 * @description Comprehensive interface representing a linked resource associated with a Decentralized Identifier (DID).
 *
 * Provides a flexible mechanism for associating and describing resources with a decentralized identity,
 * supporting various use cases such as metadata attachments, cryptographically verifiable resources,
 * and inline or externally referenced content.
 */
export interface ILinkedResource {
  /**
   * Relative path for the resource within the asset namespace.
   *
   * @type {string | undefined}
   * @optional
   * @description Provides a namespace-relative location for the resource.
   * @example "/profile/avatar.png"
   */
  path?: string;

  /**
   * Unique identifier for the resource within the DID document context.
   *
   * @type {string | undefined}
   * @optional
   * @description Enables precise referencing of resources using fragment-based identifiers.
   * @example "#myProfilePicture"
   */
  id?: string;

  /**
   * Semantic relationship between the resource and the DID subject.
   *
   * @type {string | undefined}
   * @optional
   * @description Provides context about the resource's purpose or connection to the identity.
   * @example "profile", "verification", "credential"
   */
  rel?: string;

  /**
   * JSON-LD type defining the semantic nature of the resource.
   *
   * @type {string}
   * @description Specifies the resource's type using a JSON-LD compatible type identifier.
   * @example "nft:ResourceDescriptor"
   */
  type: string;

  /**
   * Cryptographic proofs for verifying the resource's authenticity and integrity.
   *
   * @type {Object[]}
   * @optional
   * @description Supports multiple proof mechanisms to ensure the resource's validity.
   */
  proof?: {
    /**
     * Cryptographic proof mechanism for resource verification.
     *
     * @type {'hash' | 'hashgraph' | 'hashset' | undefined}
     * @optional
     * @description Defines the specific method used to generate a verifiable representation.
     */
    type?: 'hash' | 'hashgraph' | 'hashset';

    /**
     * Processing stage of the resource prior to proof generation.
     *
     * @type {'raw' | 'compressed' | 'encrypted' | 'encoded' | undefined}
     * @optional
     * @description Indicates the transformation state during proof calculation.
     */
    stage?: 'raw' | 'compressed' | 'encrypted' | 'encoded';

    /**
     * Actual cryptographic proof value for the resource.
     *
     * @type {string | undefined}
     * @optional
     * @description Contains the computed proof that can be used to verify authenticity.
     */
    value?: string;
  }[];

  /**
   * IANA media type describing the linked resource's format.
   *
   * @type {string | undefined}
   * @optional
   * @description Provides standardized identification of the resource's content type.
   * @example "image/png", "application/pdf"
   */
  resourceFormat?: string;

  /**
   * Compression method applied to the resource.
   *
   * @type {'gzip' | 'none' | undefined}
   * @optional
   * @description Enables efficient storage and transmission of resource data.
   */
  compression?: 'gzip' | 'none';

  /**
   * Encryption mechanism applied to the resource.
   *
   * @type {unknown | undefined}
   * @optional
   * @description Supports flexible encryption strategies for securing resource content.
   */
  encryption?: unknown;

  /**
   * Encoding method applied to the resource after compression and encryption.
   *
   * @type {'native' | 'multibase' | 'string' | undefined}
   * @optional
   * @description Defines how the resource is represented in its final form.
   * @example
   * - "native": Unmodified JSON-LD
   * - "multibase": Multibase-encoded content
   * - "string": String-encoded representation
   */
  encoding?: 'native' | 'multibase' | 'string';

  /**
   * External URL for retrieving the resource before decryption and decompression.
   *
   * @type {string | undefined}
   * @optional
   * @description Enables flexible resource retrieval from external sources.
   * @example "https://example.com/resources/profile-picture"
   */
  endpoint?: string;

  /**
   * Inline representation of the resource, encoded according to the specified encoding.
   *
   * @type {string | undefined}
   * @optional
   * @description Allows for direct embedding of resource content within the DID document.
   */
  resource?: string;
}
