import { Credential } from '../../types/index.js';
import { CredentialRepository } from './CredentialRepository.js';

export class CredentialManager {
  constructor(private credentialRepository: CredentialRepository) {}

  async createCredential(credentialData: Omit<Credential, 'id'>): Promise<Credential> {
    return this.credentialRepository.create(credentialData);
  }

  async getCredentialById(id: string): Promise<Credential | null> {
    return this.credentialRepository.findById(id);
  }

  async getCredentialByTransactionId(transactionId: string): Promise<Credential | null> {
    return this.credentialRepository.findByTransactionId(transactionId);
  }

  async getCredentialsByStatus(status: string): Promise<Credential[]> {
    return this.credentialRepository.findByStatus(status);
  }

  async updateCredential(id: string, updates: Partial<Credential>): Promise<void> {
    return this.credentialRepository.update(id, updates);
  }

  async deleteCredential(id: string): Promise<void> {
    return this.credentialRepository.delete(id);
  }

  async countCredentials(where?: Partial<Credential>): Promise<number> {
    return this.credentialRepository.count(where);
  }
}
