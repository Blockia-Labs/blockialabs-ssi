import { DID, DIDStatus, DIDUpdateParams } from '../types/index.js';
import { DIDManager } from '../core/identity/DIDManager.js';
import { DIDRepository } from '../core/identity/DIDRepository.js';

describe('DIDManager', () => {
  let didManager: DIDManager;
  let mockRepository: jest.Mocked<DIDRepository>;

  const sampleDID: DID = {
    id: 'did:example:123',
    controller: 'did:example:owner',
    status: 'active',
    verificationMethod: [
      {
        id: 'did:example:123#key-1',
        type: 'JsonWebKey2020',
        controller: 'did:example:123',
        publicKeyJwk: {
          kty: 'EC',
          crv: 'secp256k1',
          x: '...',
          y: '...',
        },
      },
    ],
    createdAt: Date.now(),
  };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      findByController: jest.fn(),
      findByVerificationMethod: jest.fn(),
      findByStatus: jest.fn(),
      updateVerificationMethods: jest.fn(),
      addServiceEndpoint: jest.fn(),
    } as unknown as jest.Mocked<DIDRepository>;

    didManager = new DIDManager(mockRepository);
  });

  describe('createDID', () => {
    it('should create a DID with default active status and timestamp', async () => {
      const createParams = {
        id: 'did:example:123',
        controller: 'did:example:owner',
        verificationMethod: sampleDID.verificationMethod,
      };

      mockRepository.create.mockResolvedValue({
        ...createParams,
        status: 'active',
        createdAt: expect.any(Number),
        metadata: {
          created: expect.any(String),
        },
      });

      const result = await didManager.createDID(createParams);

      expect(result.status).toBe('active');
      expect(result.createdAt).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          createdAt: expect.any(Number),
        }),
      );
    });

    it('should preserve provided status and metadata', async () => {
      const createParams = {
        id: 'did:example:123',
        controller: 'did:example:owner',
        status: 'revoked' as DIDStatus,
        metadata: {
          created: new Date().toISOString(),
          custom: 'data',
        },
      };

      mockRepository.create.mockResolvedValue({
        ...createParams,
        createdAt: Date.now(),
        metadata: {
          ...createParams.metadata,
          versionId: expect.any(String),
        },
      });

      const result = await didManager.createDID(createParams);

      expect(result.status).toBe('revoked');
      expect(result.metadata).toEqual(
        expect.objectContaining({
          created: expect.any(String),
          custom: 'data',
        }),
      );
    });
  });

  describe('getDIDById', () => {
    it('should return DID when found', async () => {
      mockRepository.findById.mockResolvedValue(sampleDID);
      const result = await didManager.getDIDById('did:example:123');
      expect(result).toEqual(sampleDID);
    });

    it('should return null when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      const result = await didManager.getDIDById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('updateDID', () => {
    it('should update DID with timestamp', async () => {
      const updates = {
        status: 'deactivated' as DIDStatus,
        metadata: { updated: 'now' },
      };

      await didManager.updateDID('did:example:123', updates);

      expect(mockRepository.update).toHaveBeenCalledWith(
        'did:example:123',
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(Number),
        }),
      );
    });

    it('should not include createdAt in updates', async () => {
      const updates: DIDUpdateParams = {
        status: 'active' as DIDStatus,
        metadata: { updated: new Date().toISOString() },
      };

      await didManager.updateDID('did:example:123', updates);

      const [calledId, calledUpdates] = mockRepository.update.mock.calls[0];

      expect(calledId).toBe('did:example:123');
      expect(calledUpdates).toEqual({
        status: 'active',
        metadata: { updated: expect.any(String) },
        updatedAt: expect.any(Number),
      });
      expect(calledUpdates).not.toHaveProperty('createdAt');
    });
  });

  describe('deleteDID', () => {
    it('should call repository delete', async () => {
      await didManager.deleteDID('did:example:123');
      expect(mockRepository.delete).toHaveBeenCalledWith('did:example:123');
    });
  });

  describe('findDIDs', () => {
    it('should find DIDs with filters', async () => {
      const testDIDs = [sampleDID];
      mockRepository.find.mockResolvedValue(testDIDs);

      const result = await didManager.findDIDs({ status: 'active' });
      expect(result).toEqual(testDIDs);
      expect(mockRepository.find).toHaveBeenCalledWith({ status: 'active' }, undefined);
    });

    it('should support limit parameter', async () => {
      await didManager.findDIDs({}, 10);
      expect(mockRepository.find).toHaveBeenCalledWith({}, 10);
    });
  });

  describe('countDIDs', () => {
    it('should count DIDs with filters', async () => {
      mockRepository.count.mockResolvedValue(5);
      const result = await didManager.countDIDs({ status: 'active' });
      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalledWith({ status: 'active' });
    });
  });
});
