export interface WebDIDPrepareOptions {
  /**
   * The domain name for the DID (e.g., 'example.com').
   */
  domain: string;

  /**
   * The public key as a Uint8Array.
   */
  publicKey: Uint8Array;

  /**
   * The type of key (e.g., 'Secp256k1', 'JsonWebKey').
   * Defaults to 'Secp256k1' if not provided.
   */
  keyType?: string;

  /**
   * Optional path for the DID (e.g., '/path/to/resource').
   */
  path?: string;

  /**
   * Optional fragment for the DID (e.g., '#key-1').
   */
  fragment?: string;

  /**
   * Optional context for the DID document.
   * Defaults to 'https://www.w3.org/ns/did/v1' if not provided.
   */
  context?: string;

  /**
   * Optional array of aliases for the DID.
   */
  alsoKnownAs?: string[];

  /**
   * Optional controller for the DID.
   * Defaults to the DID itself if not provided.
   */
  controller?: string;

  /**
   * Optional array of services to include in the DID document.
   */
  services?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;

  /**
   * Optional additional properties to include in the DID document.
   */
  additionalProperties?: Record<string, unknown>;
}
