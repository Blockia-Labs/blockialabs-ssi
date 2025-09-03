import { IDIDDocument } from '../../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentMetadata } from '../../interfaces/did-document/IDIDDocumentMetadata.js';
import {
  IDIDResolutionMetadata,
  IDIDResolutionOptions,
} from '../did-document/IDIDResolutionMetadata.js';

export interface IDIDResolver {
  resolve(
    did: string,
    resolutionOptions?: IDIDResolutionOptions,
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocument: IDIDDocument | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }>;

  resolveRepresentation(
    did: string,
    resolutionOptions: IDIDResolutionOptions,
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocumentStream: ReadableStream<Uint8Array> | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }>;
}
