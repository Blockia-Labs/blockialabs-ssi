import { ISchemaStorage } from './interfaces/ISchemaStorage.js';
import { SchemaValidator } from './validation/SchemaValidator.js';
import {
  Schema,
  SchemaCreateRequest,
  SchemaQuery,
  SchemaQueryOptions,
  SchemaUpdateRequest,
} from './types/schema.types.js';

export class SchemaSdk {
  constructor(
    private storage: ISchemaStorage,
    private validator = new SchemaValidator(),
    private schemaCache = new Map<string, Schema>(),
  ) {}

  async createSchema(data: SchemaCreateRequest): Promise<Schema> {
    const validation = this.validator.validateSchemaStructure(data.schema);
    if (validation.outcome !== 'success') {
      throw new Error(`Invalid schema: ${validation.errors?.join(', ')}`);
    }

    const digest = await this.validator.calculateDigest(data.schema);
    return await this.storage.create({
      ...data,
      metadata: data.metadata,
      contentDigest: {
        algorithm: 'sha384',
        value: digest,
      },
    });
  }

  async findSchemas(options?: SchemaQueryOptions): Promise<Schema[]> {
    return await this.storage.findMany(options);
  }

  async findSchemaById(id: string, skipCache = false): Promise<Schema> {
    if (!skipCache && this.schemaCache.has(id)) {
      return this.schemaCache.get(id) as Schema;
    }

    const schema = await this.storage.findOne({ id });
    if (!schema) throw new Error(`Schema not found: ${id}`);

    this.schemaCache.set(id, schema);
    return schema;
  }

  async findSchemaByName(name: string): Promise<Schema> {
    const schema = await this.storage.findOne({ name });
    if (!schema) throw new Error(`Schema not found with name: ${name}`);
    return schema;
  }

  async findSchemaByIssuer(issuerId: string): Promise<Schema> {
    const schema = await this.storage.findOne({ issuerId });
    if (!schema) throw new Error(`Schema not found for issuer: ${issuerId}`);
    return schema;
  }

  async findSchema(query: SchemaQuery): Promise<Schema> {
    const schema = await this.storage.findOne(query);
    if (!schema) throw new Error(`Schema not found with query: ${JSON.stringify(query)}`);
    return schema;
  }

  async updateSchema(id: string, data: SchemaUpdateRequest): Promise<Schema> {
    if (data.schema) {
      const validation = this.validator.validateSchemaStructure(data.schema);
      if (validation.outcome !== 'success') {
        throw new Error(`Invalid schema: ${validation.errors?.join(', ')}`);
      }
    }
    return await this.storage.update(id, data);
  }

  async deprecateSchema(id: string): Promise<Schema> {
    return await this.storage.update(id, { status: 'DEPRECATED' });
  }

  async deleteSchema(id: string): Promise<void> {
    await this.storage.delete(id);
    this.schemaCache.delete(id);
  }
}
