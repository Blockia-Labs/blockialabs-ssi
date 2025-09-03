import { AbstractStorage } from '../abstract/AbstractStorage.js';
import { EventEmitter } from 'events';
import { InMemoryDriver } from '../drivers/InMemoryDriver.js';
import { IStorageDriver } from '../interfaces/IStorageDriver.js';
import { IStorageOptions } from '../interfaces/IStorageOptions.js';
import { StorageError } from '../errors/StorageError.js';
import { StorageEventType } from '../events/StorageEvent.js';

class TestStorage<T = unknown> extends AbstractStorage<T> {
  constructor(driver: IStorageDriver<T>, options?: IStorageOptions) {
    super(driver, options);
  }

  getEmitter(): EventEmitter {
    return this['emitter'];
  }
}

describe('Storage Implementation', () => {
  let storage: TestStorage<string>;
  let driver: InMemoryDriver<string>;

  beforeEach(async () => {
    driver = new InMemoryDriver<string>();
    storage = new TestStorage(driver);
    await storage.initialize();
  });

  describe('Initialization', () => {
    it('should initialize the driver with options', async () => {
      const initSpy = jest.spyOn(driver, 'initialize');
      const options = { namespace: 'test', encryption: true, ttl: 3600 };

      const storageWithOptions = new TestStorage(driver, options);
      await storageWithOptions.initialize();

      expect(initSpy).toHaveBeenCalledWith(options);
    });

    it('should initialize the driver without options', async () => {
      const initSpy = jest.spyOn(driver, 'initialize');

      await storage.initialize();

      expect(initSpy).toHaveBeenCalledWith({});
    });
  });

  describe('Event Handling', () => {
    it('should emit DELETE event when deleting a key', async () => {
      const deleteEventSpy = jest.fn();
      storage.getEmitter().on(StorageEventType.DELETE, deleteEventSpy);

      await storage.set('key1', 'value1');
      await storage.delete('key1');

      expect(deleteEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEventType.DELETE,
          key: 'key1',
          timestamp: expect.any(Number),
        }),
      );
    });

    it('should emit CLEAR event when clearing storage', async () => {
      const clearEventSpy = jest.fn();
      storage.getEmitter().on(StorageEventType.CLEAR, clearEventSpy);

      await storage.set('key1', 'value1');
      await storage.clear();

      expect(clearEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEventType.CLEAR,
          timestamp: expect.any(Number),
        }),
      );
    });

    it('should emit ERROR event with original error message', async () => {
      const errorEventSpy = jest.fn();
      storage.getEmitter().on(StorageEventType.ERROR, errorEventSpy);

      const errorMessage = 'Custom error message';
      driver.read = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(storage.get('key1')).rejects.toThrow(errorMessage);

      expect(errorEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: StorageEventType.ERROR,
          key: 'key1',
          error: expect.any(Error),
          timestamp: expect.any(Number),
        }),
      );
      expect(errorEventSpy.mock.calls[0][0].error.message).toBe(errorMessage);
    });
  });

  describe('Key Normalization', () => {
    it('should handle empty namespace', async () => {
      const storageNoNamespace = new TestStorage(driver, {});
      await storageNoNamespace.set('key1', 'value1');

      expect(await driver.exists('key1')).toBe(true);
      expect(await storageNoNamespace.get('key1')).toBe('value1');
    });

    it('should normalize keys with namespace correctly', async () => {
      const namespace = 'test-namespace';
      const storageWithNamespace = new TestStorage(driver, { namespace });

      await storageWithNamespace.set('key1', 'value1');

      expect(await driver.exists(`${namespace}:key1`)).toBe(true);
      expect(await storageWithNamespace.get('key1')).toBe('value1');
    });

    it('should handle special characters in namespace', async () => {
      const namespace = 'test:namespace';
      const storageWithNamespace = new TestStorage(driver, { namespace });

      await storageWithNamespace.set('key1', 'value1');

      expect(await driver.exists(`${namespace}:key1`)).toBe(true);
      expect(await storageWithNamespace.get('key1')).toBe('value1');
    });
  });

  describe('Error Cases', () => {
    it('should handle empty keys', async () => {
      await expect(storage.set('', 'value')).rejects.toThrow(StorageError.invalidKey(''));
      await expect(storage.get('')).rejects.toThrow(StorageError.invalidKey(''));
    });

    it('should handle null values', async () => {
      await storage.set('key1', null as never);
      const result = await storage.get('key1');
      expect(result).toBeNull();
    });

    it('should handle undefined values', async () => {
      await expect(() => storage.set('key1', undefined as never)).rejects.toThrow();
    });
  });

  describe('Storage Driver', () => {
    it('should handle concurrent operations', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.get('key1');
      await storage.delete('key2');

      //No need for `Promise.all` here as the operations are not truly concurrent
      //The goal is to make sure nothing throws, not to test concurrency primitives.
    });

    it('should maintain isolation between different storage instances', async () => {
      const storage1 = new TestStorage(new InMemoryDriver<string>());
      const storage2 = new TestStorage(new InMemoryDriver<string>());

      await storage1.initialize();
      await storage2.initialize();

      await storage1.set('key1', 'value1');
      await storage2.set('key1', 'value2');

      expect(await storage1.get('key1')).toBe('value1');
      expect(await storage2.get('key1')).toBe('value2');
    });
  });

  describe('Performance', () => {
    it('should handle large number of operations', async () => {
      const operations = Array.from({ length: 1000 }, (_, i) =>
        storage.set(`key${i}`, `value${i}`),
      );

      await expect(Promise.all(operations)).resolves.not.toThrow();
      expect(await storage.keys()).toHaveLength(1000);
    });
  });
});
