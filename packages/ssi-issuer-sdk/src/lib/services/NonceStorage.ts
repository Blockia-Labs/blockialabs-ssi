import { IStorage } from '@blockialabs/ssi-storage';
import { CNonceState } from '../types.js';

export class NonceStorage implements IStorage<CNonceState> {
  private store = new Map<string, CNonceState>();

  async get(key: string): Promise<CNonceState | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: CNonceState): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}
