import { ISecureStorage } from '../../types/index.js';

export class InMemoryStorage implements ISecureStorage {
  private storage = new Map<string, string>();

  async hasItem(key: string): Promise<boolean> {
    const exists = this.storage.has(key);
    return exists;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    const value = this.storage.get(key) || null;
    return value;
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}
