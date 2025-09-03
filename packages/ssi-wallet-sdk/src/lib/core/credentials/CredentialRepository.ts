import { Credential, IDatabaseClient } from '../../types/index.js';
import { BaseRepository } from '../shared/BaseRepository.js';

export class CredentialRepository extends BaseRepository<Credential> {
  constructor(dbClient: IDatabaseClient) {
    super(dbClient, {
      tableName: 'credentials',
      schema: {
        id: { type: 'string', primaryKey: true },
        transactionId: { type: 'string', unique: true },
        vcId: { type: 'string', unique: true },
        name: { type: 'string' },
        type: { type: 'json' },
        issuer: { type: 'json' },
        issueDate: { type: 'date' },
        expirationDate: { type: 'date' },
        status: { type: 'string' },
        data: { type: 'json', required: true },
      },
      indexes: [
        {
          name: 'idx_credentials_status',
          columns: ['status'],
        },
        {
          name: 'idx_credentials_transaction_id',
          columns: ['transactionId'],
          unique: true,
        },
      ],
    });
  }

  async findByTransactionId(transactionId: string): Promise<Credential | null> {
    const result = await this.find({ transactionId }, 1);
    return result[0] || null;
  }

  async findByStatus(status: string): Promise<Credential[]> {
    return this.find({ status });
  }
}
