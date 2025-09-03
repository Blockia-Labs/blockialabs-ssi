import axios from 'axios';
import {
  IDIDDocument,
  IDIDDocumentMetadata,
  IDIDResolutionMetadata,
  IDIDResolutionOptions,
  IDIDResolver,
} from '@blockialabs/ssi-did';

export class WebDIDResolver implements IDIDResolver {
  /**
   * Resolves a DID to its DID Document and metadata.
   * @param did - The DID to resolve.
   * @param resolutionOptions - Resolution options.
   * @returns The resolved DID Document and metadata.
   */
  async resolve(
    did: string,
    resolutionOptions: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocument: IDIDDocument | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    const parts = did.split(':');
    if (parts.length !== 3 || parts[0] !== 'did' || parts[1] !== 'web') {
      return {
        didResolutionMetadata: { error: 'invalidDid' },
        didDocument: null,
        didDocumentMetadata: {},
      };
    }

    const domain = parts[2];

    try {
      const accept = resolutionOptions.accept || 'application/did+ld+json';
      const response = await axios.get(`https://${domain}/.well-known/did.json`);
      const didDocument = response.data;

      return {
        didResolutionMetadata: { contentType: accept },
        didDocument,
        didDocumentMetadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          deactivated: false,
        },
      };
    } catch (error) {
      return {
        didResolutionMetadata: {
          error: 'invalidDid',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
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
    resolutionOptions: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocumentStream: ReadableStream<Uint8Array> | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    const { didDocument } = await this.resolve(did);

    if (!didDocument) {
      return {
        didResolutionMetadata: { error: 'invalidDid' },
        didDocumentStream: null,
        didDocumentMetadata: {},
      };
    }

    const accept = resolutionOptions.accept || 'application/did+ld+json';
    const documentData = JSON.stringify(didDocument);

    const documentStream = new ReadableStream<Uint8Array>({
      start(controller) {
        const data = new TextEncoder().encode(documentData);
        controller.enqueue(data);
        controller.close();
      },
    });

    return {
      didResolutionMetadata: { contentType: accept },
      didDocumentStream: documentStream,
      didDocumentMetadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        deactivated: false,
      },
    };
  }
}
