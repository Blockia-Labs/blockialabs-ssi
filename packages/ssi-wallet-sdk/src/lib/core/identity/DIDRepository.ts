import { DID, IDatabaseClient, DIDStatus } from '../../types/index.js';
import { BaseRepository } from '../shared/BaseRepository.js';

export class DIDRepository extends BaseRepository<DID> {
  constructor(dbClient: IDatabaseClient) {
    super(dbClient, {
      tableName: 'dids',
      schema: {
        id: { type: 'string', primaryKey: true },
        controller: { type: 'json', required: true },
        verificationMethod: { type: 'json' },
        service: { type: 'json' },
        status: { type: 'string', required: true },
        metadata: { type: 'json' },
        createdAt: { type: 'number', required: true },
        updatedAt: { type: 'number' },
      },
      indexes: [
        {
          name: 'idx_dids_controller',
          columns: ['controller'],
        },
        {
          name: 'idx_dids_status',
          columns: ['status'],
        },
        {
          name: 'idx_dids_verification_method_id',
          columns: ['verificationMethod'],
          unique: true,
          partial: "JSON_EXTRACT(verificationMethod, '$[*].id') IS NOT NULL",
        },
      ],
    });
  }

  async findByController(controller: string): Promise<DID[]> {
    return this.dbClient
      .query<DID>(
        `SELECT * FROM ${this.tableDefinition.tableName}
       WHERE JSON_CONTAINS(controller, ?) OR controller = ?`,
        [JSON.stringify(controller), controller],
      )
      .then((result) => result.rows);
  }

  async findByVerificationMethod(id: string): Promise<DID | null> {
    const result = await this.dbClient.query<DID>(
      `SELECT * FROM ${this.tableDefinition.tableName}
       WHERE JSON_CONTAINS(verificationMethod, JSON_OBJECT('id', ?)) LIMIT 1`,
      [id],
    );
    return result.rows[0] || null;
  }

  async findByStatus(status: DIDStatus): Promise<DID[]> {
    return this.find({ status });
  }

  async updateVerificationMethods(id: string, methods: DID['verificationMethod']): Promise<void> {
    return this.update(id, {
      verificationMethod: methods,
      updatedAt: Date.now(),
    });
  }

  async addServiceEndpoint(
    id: string,
    service: NonNullable<DID['service']>[number],
  ): Promise<void> {
    const did = await this.findById(id);
    if (!did) throw new Error('DID not found');

    const services: NonNullable<DID['service']> = did.service
      ? [...did.service, service]
      : [service];

    return this.update(id, {
      service: services,
      updatedAt: Date.now(),
    });
  }
}
