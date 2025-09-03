import { EventEmitter } from 'events';
import { IStorage } from '../interfaces/IStorage.js';
import { IStorageDriver } from '../interfaces/IStorageDriver.js';
import { IStorageOptions } from '../interfaces/IStorageOptions.js';
import { StorageError } from '../errors/StorageError.js';
import { StorageEventType } from '../events/StorageEvent.js';

export abstract class AbstractStorage<T = unknown> implements IStorage<T> {
  private readonly emitter = new EventEmitter();

  protected constructor(
    protected readonly driver: IStorageDriver<T>,
    protected readonly options: IStorageOptions = {},
  ) {}

  async initialize(): Promise<void> {
    try {
      await this.driver.initialize(this.options);
    } catch (error) {
      this.handleErrorEvent(error, 'initialization');
      throw error;
    }
  }

  async get(key: string): Promise<T | null> {
    try {
      const normalizedKey = this.normalizeKey(key);
      const value = await this.driver.read(normalizedKey);

      this.emitter.emit(StorageEventType.GET, {
        type: StorageEventType.GET,
        key: normalizedKey,
        value,
        timestamp: Date.now(),
      });

      return value;
    } catch (error) {
      this.handleErrorEvent(error, key);
      throw error;
    }
  }

  async set(key: string, value: T): Promise<void> {
    try {
      if (!key) throw StorageError.invalidKey(key);
      if (value === undefined) throw StorageError.invalidValue(value as never);

      const normalizedKey = this.normalizeKey(key);
      await this.driver.write(normalizedKey, value);

      this.emitter.emit(StorageEventType.SET, {
        type: StorageEventType.SET,
        key: normalizedKey,
        value,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.handleErrorEvent(error, key);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const normalizedKey = this.normalizeKey(key);
      await this.driver.remove(normalizedKey);

      this.emitter.emit(StorageEventType.DELETE, {
        type: StorageEventType.DELETE,
        key: normalizedKey,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.handleErrorEvent(error, key);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const normalizedKey = this.normalizeKey(key);
      return await this.driver.exists(normalizedKey);
    } catch (error) {
      this.handleErrorEvent(error, key);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.driver.clearAll();

      this.emitter.emit(StorageEventType.CLEAR, {
        type: StorageEventType.CLEAR,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.handleErrorEvent(error, 'clear');
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      return await this.driver.listKeys();
    } catch (error) {
      this.handleErrorEvent(error, 'keys');
      throw error;
    }
  }

  protected normalizeKey(key: string): string {
    if (!key) throw StorageError.invalidKey(key);
    const namespace = this.options.namespace ? `${this.options.namespace}:` : '';
    return `${namespace}${key}`;
  }

  private handleErrorEvent(error: unknown, key: string) {
    let normalizedKey;
    try {
      normalizedKey = this.normalizeKey(key);
    } catch (error) {
      console.error(error);
      normalizedKey = key;
    }

    this.emitter.emit(StorageEventType.ERROR, {
      type: StorageEventType.ERROR,
      key: normalizedKey,
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now(),
    });
  }
}
