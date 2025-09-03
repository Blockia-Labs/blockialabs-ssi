import { IStorageDriver } from '../interfaces/IStorageDriver.js';
import { IStorageOptions } from '../interfaces/IStorageOptions.js';

export class InMemoryDriver<T = unknown> implements IStorageDriver<T> {
  private store: Map<string, T> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async initialize(_options?: IStorageOptions): Promise<void> {
    // No initialization needed for in-memory storage
  }

  async read(key: string): Promise<T | null> {
    return this.store.get(key) ?? null;
  }

  async write(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clearAll(): Promise<void> {
    this.store.clear();
  }

  async listKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}
