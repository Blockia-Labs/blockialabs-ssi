import { DIDStringValidator } from '../../core/did-string/DIDStringValidator.js';
import { IDIDDocument } from '../../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentMetadata } from '../../interfaces/did-document/IDIDDocumentMetadata.js';
import { IDIDResolver } from '../../interfaces/registry/IDIDResolver.js';
import {
  IDIDResolutionMetadata,
  IDIDResolutionOptions,
} from '../../interfaces/did-document/IDIDResolutionMetadata.js';

export class DIDResolverRegistry {
  private resolvers: Map<string, IDIDResolver> = new Map();

  register(method: string, resolver: IDIDResolver): void {
    this.resolvers.set(method, resolver);
  }

  has(method: string): boolean {
    return this.resolvers.has(method);
  }

  get(method: string): IDIDResolver | undefined {
    return this.resolvers.get(method);
  }

  getAll(): Map<string, IDIDResolver> {
    return new Map(this.resolvers);
  }

  async resolve(
    did: string,
    resolutionOptions?: IDIDResolutionOptions,
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocument: IDIDDocument | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    if (!DIDStringValidator.isValidDID(did)) {
      return {
        didResolutionMetadata: { error: 'invalidDid' },
        didDocument: null,
        didDocumentMetadata: {},
      };
    }
    const method = did.split(':')[1];
    const resolver = this.resolvers.get(method);
    if (!resolver) {
      return {
        didResolutionMetadata: { error: 'methodNotSupported' },
        didDocument: null,
        didDocumentMetadata: {},
      };
    }
    return resolver.resolve(did, resolutionOptions);
  }

  async resolveRepresentation(
    did: string,
    resolutionOptions: IDIDResolutionOptions,
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocumentStream: ReadableStream<Uint8Array> | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    if (!DIDStringValidator.isValidDID(did)) {
      return {
        didResolutionMetadata: { error: 'invalidDid' },
        didDocumentStream: null,
        didDocumentMetadata: {},
      };
    }
    const method = did.split(':')[1];
    const resolver = this.resolvers.get(method);
    if (!resolver) {
      return {
        didResolutionMetadata: { error: 'methodNotSupported' },
        didDocumentStream: null,
        didDocumentMetadata: {},
      };
    }
    return resolver.resolveRepresentation(did, resolutionOptions);
  }
}
