import { DIDMethodRegistry } from '../../core/registry/DIDMethodRegistry.js';
import { DIDOrchestrator } from '../../orchestration/DIDOrchestrator.js';
import { DIDResolverRegistry } from '../../core/registry/DIDResolverRegistry.js';
import { IDIDDocument } from '../../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentMetadata } from '../../interfaces/did-document/IDIDDocumentMetadata.js';
import { IDIDMethod } from '../../interfaces/registry/IDIDMethod.js';
import { IDIDResolutionMetadata } from '../../interfaces/did-document/IDIDResolutionMetadata.js';
import { IDIDResolver } from '../../interfaces/registry/IDIDResolver.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';

const VALID_HEX = '1234567890abcdef1234567890abcdef';
const VALID_SIGNATURE = 'aabbccddeeff00112233445566778899';

const mockDIDMethod: IDIDMethod = {
  create: jest.fn(async () => ({ did: 'mockDid', didDocument: { id: 'mockDid' } as IDIDDocument })),
  resolve: jest.fn(async () => ({
    didDocument: { id: 'mockDid' } as IDIDDocument,
    metadata: {} as IDIDDocumentMetadata,
  })),
  update: jest.fn(async () => ({ id: 'mockDid' } as IDIDDocument)),
  deactivate: jest.fn(async () => ({ didDocument: null, metadata: {} as IDIDDocumentMetadata })),
};

const mockDIDResolver: IDIDResolver = {
  resolve: jest.fn(async () => ({
    didResolutionMetadata: {} as IDIDResolutionMetadata,
    didDocument: { id: 'resolvedDid' } as IDIDDocument,
    didDocumentMetadata: {} as IDIDDocumentMetadata,
  })),
  resolveRepresentation: jest.fn(),
};

describe('DIDOrchestrator Unit Tests', () => {
  let methodRegistry: DIDMethodRegistry;
  let resolverRegistry: DIDResolverRegistry;
  let orchestrator: DIDOrchestrator;
  let mockSignatureProvider: ISignatureProvider;

  beforeEach(() => {
    methodRegistry = new DIDMethodRegistry();
    resolverRegistry = new DIDResolverRegistry();
    mockSignatureProvider = {
      sign: jest.fn().mockReturnValue(VALID_SIGNATURE),
      verify: jest.fn().mockReturnValue(true),
    };

    orchestrator = new DIDOrchestrator({
      methodRegistry,
      resolverRegistry,
      signatureProviders: {
        MockSig: mockSignatureProvider,
        ES256: mockSignatureProvider,
      },
    });

    methodRegistry.register('mock', mockDIDMethod);
  });

  describe('Constructor', () => {
    it('should throw an error if methodRegistry is not provided', () => {
      expect(() => new DIDOrchestrator({ resolverRegistry } as never)).toThrow(
        'Method registry and resolver registry are required.',
      );
    });

    it('should throw an error if resolverRegistry is not provided', () => {
      expect(() => new DIDOrchestrator({ methodRegistry } as never)).toThrow(
        'Method registry and resolver registry are required.',
      );
    });

    it('should initialize with methodRegistry and resolverRegistry', () => {
      expect(orchestrator['methodRegistry']).toBeInstanceOf(DIDMethodRegistry);
      expect(orchestrator['resolverRegistry']).toBeInstanceOf(DIDResolverRegistry);
    });

    it('should register signature providers if provided in options', () => {
      const sigProviders = { TestSig: mockSignatureProvider };
      const orch = new DIDOrchestrator({
        methodRegistry,
        resolverRegistry,
        signatureProviders: sigProviders,
      });
      expect(orch['signatureProviders'].get('TestSig')).toBe(mockSignatureProvider);
    });
  });

  describe('prepareDid', () => {
    it('should throw an error if publicKeyHex is not provided', async () => {
      await expect(orchestrator.prepareDid('test', {} as never)).rejects.toThrow(
        'publicKeyHex is required for DID preparation.',
      );
    });

    it('should prepare a DID creation message with default algorithm', async () => {
      const result = await orchestrator.prepareDid('test', { publicKeyHex: VALID_HEX });
      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.operation).toBe('create');
      expect(parsedMessage.method).toBe('test');
      expect(parsedMessage.publicKeyHex).toBe(VALID_HEX);
      expect(parsedMessage.alg).toBe('ES256');
    });

    it('should prepare a DID creation message with specified algorithm', async () => {
      const result = await orchestrator.prepareDid('test', {
        publicKeyHex: VALID_HEX,
        signatureType: 'ES256',
      });
      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.alg).toBe('ES256');
    });
  });

  describe('completeDid', () => {
    beforeEach(() => {
      methodRegistry.register('mock', mockDIDMethod);
      (mockSignatureProvider.verify as jest.Mock).mockReturnValue(true);
      (mockDIDMethod.create as jest.Mock).mockClear();
    });

    it('should throw an error if payload validation fails', async () => {
      const payload = {
        alg: 'ES256',
        method: 'mock',
        nonce: 'nonce',
        operation: 'create',
        publicKeyHex: VALID_HEX,
        timestamp: new Date().toISOString(),
      };
      const message = JSON.stringify(payload);

      await expect(
        orchestrator.completeDid('mock', {
          keyId: 'keyId',
          publicKeyHex: 'wrongPubKey',
          signature: VALID_SIGNATURE,
          signatureType: 'MockSig',
          serializedPayload: Buffer.from(message).toString('base64'),
        }),
      ).rejects.toThrow('Parameter mismatch');
    });

    it('should throw an error if signature verification fails', async () => {
      const payload = {
        alg: 'ES256',
        method: 'mock',
        nonce: 'nonce',
        operation: 'create',
        publicKeyHex: VALID_HEX,
        timestamp: new Date().toISOString(),
      };
      const message = JSON.stringify(payload);

      (mockSignatureProvider.verify as jest.Mock).mockReturnValue(false);
      await expect(
        orchestrator.completeDid('mock', {
          keyId: 'keyId',
          publicKeyHex: VALID_HEX,
          signature: VALID_SIGNATURE,
          signatureType: 'MockSig',
          serializedPayload: Buffer.from(message).toString('base64'),
        }),
      ).rejects.toThrow('Signature verification failed.');
    });

    it('should throw an error if request has expired', async () => {
      const expiredTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      const payload = {
        alg: 'ES256',
        method: 'mock',
        nonce: 'nonce',
        operation: 'create',
        publicKeyHex: VALID_HEX,
        timestamp: expiredTimestamp,
      };
      const message = JSON.stringify(payload);

      await expect(
        orchestrator.completeDid('mock', {
          keyId: 'keyId',
          publicKeyHex: VALID_HEX,
          signature: VALID_SIGNATURE,
          signatureType: 'MockSig',
          serializedPayload: Buffer.from(message).toString('base64'),
        }),
      ).rejects.toThrow('DID creation request has expired.');
    });

    it('should complete DID creation successfully', async () => {
      const payload = {
        alg: 'ES256',
        method: 'mock',
        nonce: 'nonce',
        operation: 'create',
        publicKeyHex: VALID_HEX,
        timestamp: new Date().toISOString(),
      };
      const message = JSON.stringify(payload);

      const options = {
        keyId: 'keyId',
        publicKeyHex: VALID_HEX,
        signature: VALID_SIGNATURE,
        signatureType: 'MockSig',
        serializedPayload: Buffer.from(message).toString('base64'),
      };
      const result = await orchestrator.completeDid('mock', options);
      expect(result.did).toBe('mockDid');
      expect(result.didDocument.id).toBe('mockDid');
      expect(mockDIDMethod.create).toHaveBeenCalledWith(
        expect.objectContaining({
          publicKeyHex: VALID_HEX,
          signature: VALID_SIGNATURE,
          keyId: 'keyId',
          signatureType: 'MockSig',
        }),
      );
    });
  });

  describe('prepareUpdate', () => {
    it('should throw an error if publicKeyHex is not provided', async () => {
      const updatedDocument = { id: 'did:test:123' } as IDIDDocument;
      await expect(
        orchestrator.prepareUpdate('test', 'did:test:123', updatedDocument, {} as never),
      ).rejects.toThrow('publicKeyHex is required for update preparation.');
    });

    it('should prepare a DID update message with default algorithm', async () => {
      const updatedDocument = { id: 'did:test:123' } as IDIDDocument;
      const result = await orchestrator.prepareUpdate('test', 'did:test:123', updatedDocument, {
        publicKeyHex: VALID_HEX,
      });
      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.operation).toBe('update');
      expect(parsedMessage.method).toBe('test');
      expect(parsedMessage.did).toBe('did:test:123');
      expect(parsedMessage.updatedDocument).toEqual(updatedDocument);
      expect(parsedMessage.publicKeyHex).toBe(VALID_HEX);
      expect(parsedMessage.alg).toBe('ES256');
      expect(result.serializedPayload).toBeDefined();
    });

    it('should prepare a DID update message with specified algorithm', async () => {
      const updatedDocument = { id: 'did:test:123' } as IDIDDocument;
      const result = await orchestrator.prepareUpdate('test', 'did:test:123', updatedDocument, {
        publicKeyHex: VALID_HEX,
        signatureType: 'ES256',
      });
      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.alg).toBe('ES256');
    });
  });

  describe('completeUpdate', () => {
    beforeEach(() => {
      methodRegistry.register('mock', mockDIDMethod);
      (mockSignatureProvider.verify as jest.Mock).mockReturnValue(true);
      (mockDIDMethod.update as jest.Mock).mockClear();
    });

    it('should throw an error if payload validation fails for update', async () => {
      const updatedDocument = { id: 'did:test:123' } as IDIDDocument;
      const payload = {
        alg: 'ES256',
        method: 'mock',
        did: 'did:test:123',
        nonce: 'nonce',
        operation: 'update',
        publicKeyHex: VALID_HEX,
        updatedDocument,
        timestamp: new Date().toISOString(),
      };
      const message = JSON.stringify(payload);

      await expect(
        orchestrator.completeUpdate('mock', {
          keyId: 'keyId',
          publicKeyHex: 'wrongPubKey',
          signature: VALID_SIGNATURE,
          signatureType: 'MockSig',
          serializedPayload: Buffer.from(message).toString('base64'),
        }),
      ).rejects.toThrow('Invalid update payload');
    });

    it('should complete DID update successfully', async () => {
      const updatedDocument = { id: 'did:test:123' } as IDIDDocument;

      const payload = {
        alg: 'ES256',
        method: 'mock',
        did: 'did:test:123',
        nonce: 'nonce',
        operation: 'update',
        publicKeyHex: VALID_HEX,
        updatedDocument,
        timestamp: new Date().toISOString(),
      };

      const message = JSON.stringify(payload);
      const serializedPayload = Buffer.from(message).toString('base64');

      const options = {
        keyId: 'keyId',
        publicKeyHex: VALID_HEX,
        signature: VALID_SIGNATURE,
        signatureType: 'MockSig',
        serializedPayload,
      };

      const result = await orchestrator.completeUpdate('mock', options);

      expect(result.id).toBe('mockDid');
      expect(mockDIDMethod.update).toHaveBeenCalledWith(
        'did:test:123',
        updatedDocument,
        expect.objectContaining({
          publicKeyHex: VALID_HEX,
          signature: VALID_SIGNATURE,
          keyId: 'keyId',
          signatureType: 'MockSig',
        }),
      );
    });
  });

  describe('prepareDeactivate', () => {
    it('should throw an error if publicKeyHex is not provided', async () => {
      await expect(
        orchestrator.prepareDeactivate('test', 'did:test:123', {} as never),
      ).rejects.toThrow('publicKeyHex is required for deactivation preparation.');
    });

    it('should prepare a DID deactivate message with default algorithm', async () => {
      const result = await orchestrator.prepareDeactivate('test', 'did:test:123', {
        publicKeyHex: VALID_HEX,
      });
      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.operation).toBe('deactivate');
      expect(parsedMessage.method).toBe('test');
      expect(parsedMessage.did).toBe('did:test:123');
      expect(parsedMessage.publicKeyHex).toBe(VALID_HEX);
      expect(parsedMessage.alg).toBe('ES256');
      expect(result.serializedPayload).toBeDefined();
    });

    it('should prepare a DID deactivate message with specified algorithm', async () => {
      const result = await orchestrator.prepareDeactivate('test', 'did:test:123', {
        publicKeyHex: VALID_HEX,
        signatureType: 'ES256',
      });
      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.alg).toBe('ES256');
    });
  });

  describe('completeDeactivate', () => {
    beforeEach(() => {
      methodRegistry.register('mock', mockDIDMethod);
      (mockSignatureProvider.verify as jest.Mock).mockReturnValue(true);
      (mockDIDMethod.deactivate as jest.Mock).mockClear();
    });

    it('should throw an error if payload validation fails for deactivate', async () => {
      const payload = {
        alg: 'ES256',
        method: 'mock',
        did: 'did:test:123',
        nonce: 'nonce',
        operation: 'deactivate',
        publicKeyHex: VALID_HEX,
        timestamp: new Date().toISOString(),
      };
      const message = JSON.stringify(payload, Object.keys(payload).sort());

      await expect(
        orchestrator.completeDeactivate('mock', {
          keyId: 'keyId',
          publicKeyHex: 'wrongPubKey',
          signature: VALID_SIGNATURE,
          signatureType: 'MockSig',
          serializedPayload: Buffer.from(message).toString('base64'),
        }),
      ).rejects.toThrow('Invalid deactivation payload');
    });

    it('should complete DID deactivation successfully', async () => {
      const payload = {
        alg: 'ES256',
        method: 'mock',
        did: 'did:test:123',
        nonce: 'nonce',
        operation: 'deactivate',
        publicKeyHex: VALID_HEX,
        timestamp: new Date().toISOString(),
      };
      const message = JSON.stringify(payload);
      const serializedPayload = Buffer.from(message).toString('base64');
      const options = {
        keyId: 'keyId',
        publicKeyHex: VALID_HEX,
        signature: VALID_SIGNATURE,
        signatureType: 'MockSig',
        serializedPayload,
      };

      const result = await orchestrator.completeDeactivate('mock', options);

      expect(result.didDocument).toBeNull();
      expect(result.metadata).toEqual({});

      expect(mockDIDMethod.deactivate).toHaveBeenCalledWith(
        'did:test:123',
        expect.objectContaining({
          publicKeyHex: VALID_HEX,
          signature: VALID_SIGNATURE,
          keyId: 'keyId',
          signatureType: 'MockSig',
        }),
      );
    });
  });

  describe('resolve', () => {
    beforeEach(() => {
      resolverRegistry.register('mock', mockDIDResolver);
      (mockDIDResolver.resolve as jest.Mock).mockClear();
    });

    it('should resolve DID successfully', async () => {
      const did = 'did:mock:123';
      const didDocument = await orchestrator.resolve(did);
      expect(didDocument).toBeDefined();
      expect(didDocument.id).toBe('resolvedDid');
      expect(mockDIDResolver.resolve).toHaveBeenCalledWith(did, {});
    });

    it('should throw error if DID is not provided', async () => {
      await expect(orchestrator.resolve('')).rejects.toThrow('DID is required');
    });

    it('should throw error if no resolver is registered for the method', async () => {
      await expect(orchestrator.resolve('did:unknown:123')).rejects.toThrow(
        'No resolver registered for method: unknown',
      );
    });

    it('should throw error if resolver fails to resolve DID (returns null didDocument)', async () => {
      const failingResolver: IDIDResolver = {
        resolve: jest.fn(async () => ({
          didResolutionMetadata: {} as IDIDResolutionMetadata,
          didDocument: null,
          didDocumentMetadata: {} as IDIDDocumentMetadata,
        })),
        resolveRepresentation: jest.fn(async () => ({
          didResolutionMetadata: {} as IDIDResolutionMetadata,
          didDocumentStream: null,
          didDocumentMetadata: {} as IDIDDocumentMetadata,
        })),
      };
      resolverRegistry.register('fail-mock', failingResolver);
      await expect(orchestrator.resolve('did:fail-mock:123')).rejects.toThrow(
        'Failed to resolve DID',
      );
      expect(failingResolver.resolve).toHaveBeenCalled();
    });
  });

  describe('signature verification', () => {
    it('should throw error for unknown signature provider', async () => {
      const { serializedPayload } = await orchestrator.prepareDid('mock', {
        publicKeyHex: VALID_HEX,
        signatureType: 'UnknownSig',
      });

      await expect(
        orchestrator.completeDid('mock', {
          publicKeyHex: VALID_HEX,
          signature: VALID_SIGNATURE,
          signatureType: 'UnknownSig',
          serializedPayload,
        }),
      ).rejects.toThrow('No signature provider registered for type: UnknownSig');
    });

    it('should verify signature successfully', async () => {
      const { serializedPayload } = await orchestrator.prepareDid('mock', {
        publicKeyHex: VALID_HEX,
        signatureType: 'MockSig',
      });

      const result = await orchestrator.completeDid('mock', {
        publicKeyHex: VALID_HEX,
        signature: VALID_SIGNATURE,
        signatureType: 'MockSig',
        serializedPayload,
      });

      expect(result.did).toBe('mockDid');
    });

    it('should throw error if signature verification fails', async () => {
      (mockSignatureProvider.verify as jest.Mock).mockReturnValue(false);

      const { serializedPayload } = await orchestrator.prepareDid('mock', {
        publicKeyHex: VALID_HEX,
        signatureType: 'MockSig',
      });

      await expect(
        orchestrator.completeDid('mock', {
          publicKeyHex: VALID_HEX,
          signature: VALID_SIGNATURE,
          signatureType: 'MockSig',
          serializedPayload,
        }),
      ).rejects.toThrow('Signature verification failed.');
    });
  });

  describe('Registry Management', () => {
    it('registerMethod should register a DID method', () => {
      orchestrator.registerMethod('test', mockDIDMethod);
      expect(orchestrator.getMethod('test')).toBe(mockDIDMethod);
    });

    it('registerResolver should register a DID resolver', () => {
      orchestrator.registerResolver('test', mockDIDResolver);
      expect(orchestrator.getResolver('test')).toBe(mockDIDResolver);
    });

    it('registerSignatureProvider should register a signature provider', () => {
      orchestrator.registerSignatureProvider('NewSig', mockSignatureProvider);
      expect(orchestrator.getSignatureProvider('NewSig')).toBe(mockSignatureProvider);
    });

    it('getMethod should return registered DID method', () => {
      methodRegistry.register('test', mockDIDMethod);
      expect(orchestrator.getMethod('test')).toBe(mockDIDMethod);
      expect(orchestrator.getMethod('unknown')).toBeUndefined();
    });

    it('getResolver should return registered DID resolver', () => {
      resolverRegistry.register('test', mockDIDResolver);
      expect(orchestrator.getResolver('test')).toBe(mockDIDResolver);
      expect(orchestrator.getResolver('unknown')).toBeUndefined();
    });

    it('getSignatureProvider should return registered signature provider', () => {
      orchestrator.registerSignatureProvider('TestSig', mockSignatureProvider);
      expect(orchestrator.getSignatureProvider('TestSig')).toBe(mockSignatureProvider);
      expect(orchestrator.getSignatureProvider('UnknownSig')).toBeUndefined();
    });

    it('hasMethod should return true if method is registered', () => {
      methodRegistry.register('test', mockDIDMethod);
      expect(orchestrator.hasMethod('test')).toBe(true);
      expect(orchestrator.hasMethod('unknown')).toBe(false);
    });

    it('hasResolver should return true if resolver is registered', () => {
      resolverRegistry.register('test', mockDIDResolver);
      expect(orchestrator.hasResolver('test')).toBe(true);
      expect(orchestrator.hasResolver('unknown')).toBe(false);
    });

    it('isSupported should return true if method and resolver are registered', () => {
      methodRegistry.register('test', mockDIDMethod);
      resolverRegistry.register('test', mockDIDResolver);
      expect(orchestrator.isSupported('test')).toBe(true);
      expect(orchestrator.isSupported('unknown')).toBe(false);
    });

    it('registeredMethods should return array of registered methods', () => {
      methodRegistry.register('method1', mockDIDMethod);
      methodRegistry.register('method2', mockDIDMethod);
      expect(orchestrator.registeredMethods).toEqual(
        expect.arrayContaining(['method1', 'method2']),
      );
    });

    it('registeredResolvers should return array of registered resolvers', () => {
      resolverRegistry.register('resolver1', mockDIDResolver);
      resolverRegistry.register('resolver2', mockDIDResolver);
      expect(orchestrator.registeredResolvers).toEqual(
        expect.arrayContaining(['resolver1', 'resolver2']),
      );
    });

    it('stats should return stats about registered methods and resolvers', () => {
      const testMethodRegistry = new DIDMethodRegistry();
      const testResolverRegistry = new DIDResolverRegistry();
      const testOrchestrator = new DIDOrchestrator({
        methodRegistry: testMethodRegistry,
        resolverRegistry: testResolverRegistry,
      });

      testMethodRegistry.register('method1', mockDIDMethod);
      testMethodRegistry.register('method2', mockDIDMethod);
      testResolverRegistry.register('method1', mockDIDResolver);
      testResolverRegistry.register('method2', mockDIDResolver);

      const stats = testOrchestrator.stats;
      expect(stats.methods).toBe(2);
      expect(stats.resolvers).toBe(2);
      expect(stats.supported).toEqual(['method1', 'method2']);
    });
  });
});
