import { IStorageOptions } from './IStorageOptions.js';

export interface IStorageDriver<T = unknown> {
  initialize(options?: IStorageOptions): Promise<void>;

  read(key: string): Promise<T | null>;

  write(key: string, value: T): Promise<void>;

  remove(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  clearAll(): Promise<void>;

  listKeys(): Promise<string[]>;
}
