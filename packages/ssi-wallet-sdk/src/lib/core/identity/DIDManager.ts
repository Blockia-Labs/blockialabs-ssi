import { DID, DIDStatus, DIDUpdateParams } from '../../types/index.js';
import { DIDRepository } from './DIDRepository.js';

export class DIDManager {
  constructor(private didRepository: DIDRepository) {}

  async createDID(params: {
    id: string;
    controller: string | string[];
    verificationMethod?: DID['verificationMethod'];
    service?: DID['service'];
    status?: DIDStatus;
    metadata?: DID['metadata'];
  }): Promise<DID> {
    const now = Date.now();
    const did: Omit<DID, 'id'> = {
      ...params,
      status: params.status || 'active',
      metadata: params.metadata || {
        created: new Date(now).toISOString(),
      },
      createdAt: now,
    };
    return this.didRepository.create(did);
  }

  async getDIDById(id: string): Promise<DID | null> {
    return this.didRepository.findById(id);
  }

  async updateDID(id: string, updates: DIDUpdateParams): Promise<void> {
    return this.didRepository.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  }

  async deleteDID(id: string): Promise<void> {
    return this.didRepository.delete(id);
  }

  async findDIDs(where?: Partial<DID>, limit?: number): Promise<DID[]> {
    return this.didRepository.find(where, limit);
  }

  async countDIDs(where?: Partial<DID>): Promise<number> {
    return this.didRepository.count(where);
  }
}
