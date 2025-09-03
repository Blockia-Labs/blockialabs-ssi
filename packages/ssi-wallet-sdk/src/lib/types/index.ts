export * from './models/activity.js';
export * from './models/credential.js';
export * from './models/did.js';
export * from './models/jwt.js';
export * from './models/wallet.js';

export interface ISecureStorage {
  hasItem(key: string): Promise<boolean>;
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface IDatabaseClient {
  query<T = unknown>(sql: string, params?: QueryParam[]): Promise<{ rows: T[] }>;
  execute(sql: string, params?: QueryParam[]): Promise<void>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

export interface IRepository<T extends { id: string }> {
  create(data: Omit<T, 'id'>): Promise<T>;
  find(where?: Partial<T>, limit?: number): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
  count(where?: Partial<T>): Promise<number>;
}

export interface ITableDefinition<T extends { id: string }> {
  tableName: string;
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'json' | 'date';
      primaryKey?: boolean;
      required?: boolean;
      unique?: boolean;
    };
  };
  indexes?: Array<{
    name: string;
    columns: (keyof T)[];
    unique?: boolean;
    partial?: string;
  }>;
}

export type QueryParam =
  | string
  | number
  | boolean
  | Date
  | null
  | Record<string, unknown>
  | QueryParam[];

export interface JsonWebKey {
  kty: string;
  crv: string;
  x: string;
  y: string;
}
