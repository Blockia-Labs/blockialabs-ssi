import { Credential } from '../types/index.js';
import { CredentialManager } from '../core/credentials/CredentialManager.js';
import { CredentialRepository } from '../core/credentials/CredentialRepository.js';

describe('CredentialManager', () => {
  let credentialManager: CredentialManager;
  let mockCredentialRepository: jest.Mocked<CredentialRepository>;

  beforeEach(() => {
    mockCredentialRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTransactionId: jest.fn(),
      findByStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<CredentialRepository>;

    credentialManager = new CredentialManager(mockCredentialRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCredential', () => {
    it('should create a credential using the repository', async () => {
      const credentialData: Omit<Credential, 'id'> = {
        transactionId: 'txn123',
        data: { key: 'value' },
      };

      const mockCredential: Credential = {
        id: 'cred123',
        ...credentialData,
      };

      mockCredentialRepository.create.mockResolvedValue(mockCredential);

      const result = await credentialManager.createCredential(credentialData);

      expect(mockCredentialRepository.create).toHaveBeenCalledWith(credentialData);
      expect(result).toEqual(mockCredential);
    });
  });

  describe('getCredentialById', () => {
    it('should retrieve a credential by ID', async () => {
      const mockCredential: Credential = {
        id: 'cred123',
        transactionId: 'txn123',
        data: { key: 'value' },
      };

      mockCredentialRepository.findById.mockResolvedValue(mockCredential);

      const result = await credentialManager.getCredentialById('cred123');

      expect(mockCredentialRepository.findById).toHaveBeenCalledWith('cred123');
      expect(result).toEqual(mockCredential);
    });

    it('should return null when credential not found', async () => {
      mockCredentialRepository.findById.mockResolvedValue(null);

      const result = await credentialManager.getCredentialById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getCredentialByTransactionId', () => {
    it('should retrieve a credential by transaction ID', async () => {
      const mockCredential: Credential = {
        id: 'cred123',
        transactionId: 'txn123',
        data: { key: 'value' },
      };

      mockCredentialRepository.findByTransactionId.mockResolvedValue(mockCredential);

      const result = await credentialManager.getCredentialByTransactionId('txn123');

      expect(mockCredentialRepository.findByTransactionId).toHaveBeenCalledWith('txn123');
      expect(result).toEqual(mockCredential);
    });
  });

  describe('updateCredential', () => {
    it('should update a credential', async () => {
      const updates: Partial<Credential> = {
        status: 'verified',
        data: { newKey: 'newValue' },
      };

      mockCredentialRepository.update.mockResolvedValue(undefined);

      await credentialManager.updateCredential('cred123', updates);

      expect(mockCredentialRepository.update).toHaveBeenCalledWith('cred123', updates);
    });
  });

  describe('deleteCredential', () => {
    it('should delete a credential', async () => {
      mockCredentialRepository.delete.mockResolvedValue(undefined);

      await credentialManager.deleteCredential('cred123');

      expect(mockCredentialRepository.delete).toHaveBeenCalledWith('cred123');
    });
  });
});
