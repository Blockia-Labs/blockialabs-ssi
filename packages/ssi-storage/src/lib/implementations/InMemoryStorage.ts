import { AbstractStorage } from '../abstract/AbstractStorage.js';
import { InMemoryDriver } from '../drivers/InMemoryDriver.js';
import { IStorageOptions } from '../interfaces/IStorageOptions.js';

export class InMemoryStorage<T = unknown> extends AbstractStorage<T> {
  constructor(options?: IStorageOptions) {
    super(new InMemoryDriver<T>(), options);
  }
}
