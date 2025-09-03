export interface IStorage<T = unknown> {
  get(key: string): Promise<T | null>;

  set(key: string, value: T): Promise<void>;

  delete(key: string): Promise<void>;

  has(key: string): Promise<boolean>;

  clear(): Promise<void>;

  keys(): Promise<string[]>;
}
