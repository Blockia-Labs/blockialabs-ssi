import cbor from 'cbor';
import * as jsonld from 'jsonld';

/**
 * Utility class for serializing and processing DID documents
 */
export class DIDDocumentSerializer {
  /**
   * Checks if the requested content type is supported.
   * @param contentType - The requested content type.
   * @returns True if the content type is supported.
   */
  static isSupportedContentType(contentType: string): boolean {
    const supportedTypes = [
      'application/did+json',
      'application/did+ld+json',
      'application/did+cbor',
    ];
    return supportedTypes.includes(contentType);
  }

  // Todo: Replace any with a more specific type if available
  /**
   * Serializes a DID document to a JSON string
   *
   * @param document - The DID document to serialize
   * @returns The document as a formatted JSON string representation
   */
  static toJSON(document: Record<string, any>): string {
    return JSON.stringify(document, null, 2);
  }

  /**
   * Serializes a DID document to a JSON-LD string with processing options
   *
   * @param document - The DID document to serialize
   * @param options - Options for JSON-LD processing
   * @returns Promise resolving to the processed JSON-LD string
   * @throws Error if the document lacks a @context or processing fails
   */
  static async toJSONLD(
    document: Record<string, any>,
    options: {
      context?: string | string[] | (string | Record<string, any>)[];
      compact?: boolean;
      expand?: boolean;
    } = {},
  ): Promise<string> {
    if (!document['@context']) {
      throw new Error('DID Document must have a @context for JSON-LD serialization');
    }

    try {
      let processed = document;

      // Apply expansion if requested
      if (options.expand) {
        processed = await jsonld.expand(document);
      }

      // Apply compaction if requested
      if (options.compact) {
        const context = options.context || document['@context'];
        processed = await jsonld.compact(processed, context);
      }

      return JSON.stringify(processed, null, 2);
    } catch (error) {
      throw new Error(`JSON-LD processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Serializes a DID document to a CBOR byte array
   *
   * @param document - The DID document to serialize
   * @returns The document as a CBOR byte array
   * @throws Error if serialization fails
   */
  static toCBOR(document: Record<string, any>): Uint8Array {
    try {
      return cbor.encode(document);
    } catch (error) {
      throw new Error(`CBOR serialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parses a JSON-LD string into a DID document
   *
   * @param jsonldString - The JSON-LD string to parse
   * @returns Promise resolving to the parsed DID document
   * @throws Error if parsing fails or the document is invalid
   */
  static async fromJSONLD(jsonldString: string): Promise<Record<string, any>> {
    try {
      const parsed = JSON.parse(jsonldString);

      // Basic validation
      if (!parsed.id || !parsed['@context']) {
        throw new Error('Invalid DID Document: missing required fields');
      }

      // Ensure it's valid JSON-LD
      await jsonld.expand(parsed);

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse JSON-LD: ${(error as Error).message}`);
    }
  }

  /**
   * Parses a CBOR byte array into a DID document
   *
   * @param cborData - The CBOR byte array to parse
   * @returns The parsed DID document
   * @throws Error if parsing fails or the document is invalid
   */
  static fromCBOR(cborData: Uint8Array): Record<string, any> {
    try {
      const parsed = cbor.decode(cborData);

      // Basic validation
      if (!parsed.id || !parsed['@context']) {
        throw new Error('Invalid DID Document: missing required fields');
      }

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse CBOR: ${(error as Error).message}`);
    }
  }

  /**
   * Produces a canonicalized version of the DID document
   *
   * @param document - The DID document to canonicalize
   * @returns Promise resolving to the canonicalized document in N-Quads format
   * @throws Error if the document lacks a @context or canonicalization fails
   */
  static async canonicalize(document: Record<string, any>): Promise<string> {
    if (!document['@context']) {
      throw new Error('DID Document must have a @context for canonicalization');
    }

    try {
      return await jsonld.canonize(document, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
      });
    } catch (error) {
      throw new Error(`Canonicalization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Serializes a DID document to the requested representation
   *
   * @param document - The DID document to serialize
   * @param contentType - The requested content type (e.g., 'application/did+json', 'application/did+ld+json', 'application/did+cbor')
   * @returns The serialized document in the requested format
   * @throws Error if the content type is unsupported or serialization fails
   */
  static async serialize(
    document: Record<string, any>,
    contentType: string,
  ): Promise<string | Uint8Array> {
    if (!this.isSupportedContentType(contentType)) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    switch (contentType) {
      case 'application/did+json':
        return this.toJSON(document);
      case 'application/did+ld+json':
        return this.toJSONLD(document);
      case 'application/did+cbor':
        return this.toCBOR(document);
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  /**
   * Parses a DID document from the requested representation
   *
   * @param data - The serialized document (string or Uint8Array)
   * @param contentType - The content type of the serialized document
   * @returns The parsed DID document
   * @throws Error if the content type is unsupported or parsing fails
   */
  static async parse(data: string | Uint8Array, contentType: string): Promise<Record<string, any>> {
    if (!this.isSupportedContentType(contentType)) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    switch (contentType) {
      case 'application/did+json':
      case 'application/did+ld+json':
        return this.fromJSONLD(data as string);
      case 'application/did+cbor':
        return this.fromCBOR(data as Uint8Array);
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }
}
