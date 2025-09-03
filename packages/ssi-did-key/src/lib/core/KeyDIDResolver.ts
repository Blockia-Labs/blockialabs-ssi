import {
  IDIDResolver,
  IDIDResolutionMetadata,
  IDIDDocument,
  IDIDDocumentMetadata,
  IDIDResolutionOptions,
  DIDDocumentSerializer,
} from '@blockialabs/ssi-did';
import { KeyDIDMethod } from './KeyDIDMethod.js';

export class KeyDIDResolver implements IDIDResolver {
  private keyDIDMethod: KeyDIDMethod;

  constructor(keyDIDMethod: KeyDIDMethod) {
    this.keyDIDMethod = keyDIDMethod;
  }

  /**
   * Resolves a DID to its DID Document and metadata.
   * @param did - The DID to resolve.
   * @param resolutionOptions - Resolution options.
   * @returns The resolved DID Document and metadata.
   */
  async resolve(did: string): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocument: IDIDDocument | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    try {
      const { didDocument, metadata } = await this.keyDIDMethod.resolve(did);
      return {
        didResolutionMetadata: {
          contentType: 'application/did+ld+json',
        },
        didDocument,
        didDocumentMetadata: metadata,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        didResolutionMetadata: {
          error: 'invalidDid',
          message: errorMessage,
        },
        didDocument: null,
        didDocumentMetadata: {},
      };
    }
  }

  /**
   * Resolves a DID to its representation (e.g., as a stream).
   * @param did - The DID to resolve.
   * @param resolutionOptions - Resolution options.
   * @returns The resolved DID Document as a stream.
   */
  async resolveRepresentation(
    did: string,
    options: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocumentStream: ReadableStream<Uint8Array> | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    const result = await this.resolve(did);

    if (!result.didDocument) {
      return {
        ...result,
        didDocumentStream: null,
      };
    }

    try {
      const accept = options.accept || 'application/did+ld+json';
      const documentData = await DIDDocumentSerializer.serialize(result.didDocument, accept);

      return {
        didResolutionMetadata: {
          ...result.didResolutionMetadata,
          contentType: accept,
        },
        didDocumentStream: new ReadableStream({
          start(controller) {
            const data =
              typeof documentData === 'string'
                ? new TextEncoder().encode(documentData)
                : documentData;
            controller.enqueue(data);
            controller.close();
          },
        }),
        didDocumentMetadata: result.didDocumentMetadata,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        didResolutionMetadata: {
          error: 'representationError',
          message: errorMessage,
        },
        didDocumentStream: null,
        didDocumentMetadata: result.didDocumentMetadata,
      };
    }
  }
}
