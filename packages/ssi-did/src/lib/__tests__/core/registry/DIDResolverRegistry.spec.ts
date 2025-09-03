import { DIDResolverRegistry } from '../../../core/registry/DIDResolverRegistry.js';
import { IDIDDocument } from '../../../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentMetadata } from '../../../interfaces/did-document/IDIDDocumentMetadata.js';
import {
  IDIDResolutionMetadata,
  IDIDResolutionOptions,
} from '../../../interfaces/did-document/IDIDResolutionMetadata.js';
import { IDIDResolver } from '../../../interfaces/registry/IDIDResolver.js';

// Mock IDIDDocument for testing purposes
const mockDIDDocument: IDIDDocument = {
  'id': 'did:mock:test',
  '@context': 'https://www.w3.org/ns/did/v1',
  'verificationMethod': [],
};

class MockResolver implements IDIDResolver {
  async resolve(did: string): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocument: IDIDDocument | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    if (did === 'did:mock:test') {
      return {
        didResolutionMetadata: {},
        didDocument: mockDIDDocument,
        didDocumentMetadata: { created: new Date().toISOString() },
      };
    } else if (did === 'did:mock:notfound') {
      return {
        didResolutionMetadata: { error: 'notFound' },
        didDocument: null,
        didDocumentMetadata: {},
      };
    } else if (did === 'did:mock:representationnotsupported') {
      return {
        didResolutionMetadata: { error: 'representationNotSupported' },
        didDocument: null,
        didDocumentMetadata: {},
      };
    }
    return {
      didResolutionMetadata: { error: 'methodNotSupported' },
      didDocument: null,
      didDocumentMetadata: {},
    };
  }

  async resolveRepresentation(
    did: string,
    resolutionOptions: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocumentStream: ReadableStream<Uint8Array> | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    if (resolutionOptions?.accept === 'application/json') {
      const didDocumentJson = JSON.stringify(mockDIDDocument, null, 2);
      const encoder = new TextEncoder();
      const encodedDocument = encoder.encode(didDocumentJson);
      const didDocumentStream = new ReadableStream({
        start(controller) {
          controller.enqueue(encodedDocument);
          controller.close();
        },
      });
      return {
        didResolutionMetadata: { contentType: 'application/json' },
        didDocumentStream,
        didDocumentMetadata: { created: new Date().toISOString() },
      };
    } else if (did === 'did:mock:representationnotsupported') {
      return {
        didResolutionMetadata: { error: 'representationNotSupported' },
        didDocumentStream: null,
        didDocumentMetadata: {},
      };
    }
    return {
      didResolutionMetadata: { error: 'representationNotSupported' }, // Default error: no representation
      didDocumentStream: null,
      didDocumentMetadata: {},
    };
  }
}

describe('DIDResolverRegistry', () => {
  let registry: DIDResolverRegistry;
  let mockResolver: MockResolver;

  beforeEach(() => {
    registry = new DIDResolverRegistry();
    mockResolver = new MockResolver();
  });

  it('should register and resolve a DID', async () => {
    registry.register('mock', mockResolver);
    const resolveResult = await registry.resolve('did:mock:test', {});
    expect(resolveResult.didDocument?.id).toBe('did:mock:test');
    expect(resolveResult.didResolutionMetadata.error).toBeUndefined();
    expect(resolveResult.didDocumentMetadata.created).toBeDefined();
  });

  it('should return methodNotSupported error if no resolver is registered for the method', async () => {
    const resolveResult = await registry.resolve('did:unknown:test', {});
    expect(resolveResult.didResolutionMetadata.error).toBe('methodNotSupported');
    expect(resolveResult.didDocument).toBeNull();
    expect(resolveResult.didDocumentMetadata).toEqual({});
  });

  it('should return invalidDid error for invalid DID format', async () => {
    const resolveResult = await registry.resolve('invalid-did');
    expect(resolveResult.didResolutionMetadata.error).toBe('invalidDid');
    expect(resolveResult.didDocument).toBeNull();
    expect(resolveResult.didDocumentMetadata).toEqual({});
  });

  it('should handle empty DID string', async () => {
    const resolveResult = await registry.resolve('');
    expect(resolveResult.didResolutionMetadata.error).toBe('invalidDid');
    expect(resolveResult.didDocument).toBeNull();
    expect(resolveResult.didDocumentMetadata).toEqual({});
  });

  it('should handle DID with missing method', async () => {
    const resolveResult = await registry.resolve('did::test');
    expect(resolveResult.didResolutionMetadata.error).toBe('invalidDid');
    expect(resolveResult.didDocument).toBeNull();
    expect(resolveResult.didDocumentMetadata).toEqual({});
  });

  it('should resolveRepresentation and return a stream with correct content type', async () => {
    registry.register('mock', mockResolver);
    const resolveRepresentationResult = await registry.resolveRepresentation('did:mock:test', {
      accept: 'application/json',
    });
    expect(resolveRepresentationResult.didDocumentStream).toBeInstanceOf(ReadableStream);
    expect(resolveRepresentationResult.didResolutionMetadata.contentType).toBe('application/json');
    expect(resolveRepresentationResult.didDocumentMetadata.created).toBeDefined();
  });

  it('resolveRepresentation should return null stream and representationNotSupported error if accept header not supported', async () => {
    registry.register('mock', mockResolver);
    const resolveRepresentationResult = await registry.resolveRepresentation('did:mock:test', {
      accept: 'application/xml',
    });
    expect(resolveRepresentationResult.didDocumentStream).toBeNull();
    expect(resolveRepresentationResult.didResolutionMetadata.error).toBe(
      'representationNotSupported',
    );
    expect(resolveRepresentationResult.didDocumentMetadata).toEqual({});
  });

  it('resolveRepresentation should return null stream and methodNotSupported error if no resolver for method', async () => {
    const resolveRepresentationResult = await registry.resolveRepresentation('did:unknown:test', {
      accept: 'application/json',
    });
    expect(resolveRepresentationResult.didDocumentStream).toBeNull();
    expect(resolveRepresentationResult.didResolutionMetadata.error).toBe('methodNotSupported');
    expect(resolveRepresentationResult.didDocumentMetadata).toEqual({});
  });

  it('resolveRepresentation should handle invalid DID format and return invalidDid error', async () => {
    const resolveRepresentationResult = await registry.resolveRepresentation('invalid-did', {
      accept: 'application/json',
    });
    expect(resolveRepresentationResult.didDocumentStream).toBeNull();
    expect(resolveRepresentationResult.didResolutionMetadata.error).toBe('invalidDid');
    expect(resolveRepresentationResult.didDocumentMetadata).toEqual({});
  });

  it('resolve should return notFound error from underlying resolver', async () => {
    registry.register('mock', mockResolver);
    const resolveResult = await registry.resolve('did:mock:notfound', {});
    expect(resolveResult.didResolutionMetadata.error).toBe('notFound');
    expect(resolveResult.didDocument).toBeNull();
    expect(resolveResult.didDocumentMetadata).toEqual({});
  });

  it('resolveRepresentation should return representationNotSupported error from underlying resolver', async () => {
    registry.register('mock', mockResolver);
    const resolveRepresentationResult = await registry.resolveRepresentation(
      'did:mock:representationnotsupported',
      {},
    );
    expect(resolveRepresentationResult.didResolutionMetadata.error).toBe(
      'representationNotSupported',
    );
    expect(resolveRepresentationResult.didDocumentStream).toBeNull();
    expect(resolveRepresentationResult.didDocumentMetadata).toEqual({});
  });

  it('should handle resolutionOptions being undefined', async () => {
    registry.register('mock', mockResolver);
    const resolveResult = await registry.resolve('did:mock:test', undefined as never);
    expect(resolveResult.didDocument?.id).toBe('did:mock:test');
    expect(resolveResult.didResolutionMetadata.error).toBeUndefined();
  });

  it('resolveRepresentation should handle resolutionOptions being undefined', async () => {
    registry.register('mock', mockResolver);
    const resolveRepresentationResult = await registry.resolveRepresentation(
      'did:mock:test',
      undefined as never,
    );
    expect(resolveRepresentationResult.didDocumentStream).toBe(null);
    expect(resolveRepresentationResult.didResolutionMetadata.contentType).toBeUndefined();
  });
});
