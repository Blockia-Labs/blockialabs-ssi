import {
  SchemaCreateRequest,
  Schema,
  SchemaQueryOptions,
  SchemaQuery,
  SchemaUpdateRequest,
} from '../types/schema.types.js';

export interface ISchemaStorage {
  create(request: SchemaCreateRequest): Promise<Schema>;
  findMany(options?: SchemaQueryOptions): Promise<Schema[]>;
  findOne(query: SchemaQuery): Promise<Schema | null>;
  update(id: string, request: SchemaUpdateRequest): Promise<Schema>;
  delete(id: string): Promise<void>;
}
