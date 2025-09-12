# SSI Storage

The `ssi-storage` package provides a unified storage abstraction for Self-Sovereign Identity (SSI) systems. It offers a consistent interface for data persistence with support for different storage backends.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-storage
```

## Key Components

### Core Interface

- `IStorage<T>`: Generic storage interface with async operations

### Implementations

- `InMemoryStorage<T>`: In-memory storage implementation
- `AbstractStorage<T>`: Base class for custom storage implementations

### Drivers

- `InMemoryDriver`: Driver for in-memory storage operations

## Basic Usage

### Using In-Memory Storage

```typescript
import { InMemoryStorage } from '@blockialabs/ssi-storage';

// Create storage instance
const storage = new InMemoryStorage<string>();

// Store data
await storage.set('key1', 'Hello, World!');
await storage.set('key2', 'SSI Storage');

// Retrieve data
const value = await storage.get('key1');
console.log(value); // 'Hello, World!'

// Check existence
const exists = await storage.has('key1');
console.log(exists); // true

// List all keys
const keys = await storage.keys();
console.log(keys); // ['key1', 'key2']

// Delete data
await storage.delete('key1');

// Clear all data
await storage.clear();
```

### Generic Type Support

```typescript
// Typed storage for complex objects
interface User {
  id: string;
  name: string;
  email: string;
}

const userStorage = new InMemoryStorage<User>();

await userStorage.set('user123', {
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
});

const user = await userStorage.get('user123');
console.log(user?.name); // 'John Doe'
```

## Custom Storage Implementation

### Extending AbstractStorage

```typescript
import { AbstractStorage } from '@blockialabs/ssi-storage';
import { IStorageDriver } from '@blockialabs/ssi-storage';

class CustomDriver implements IStorageDriver {
  // Implement storage operations
  async get(key: string): Promise<unknown> {
    // Custom retrieval logic
    return data;
  }

  async set(key: string, value: unknown): Promise<void> {
    // Custom storage logic
  }

  async delete(key: string): Promise<void> {
    // Custom deletion logic
  }

  async has(key: string): Promise<boolean> {
    // Custom existence check
    return exists;
  }

  async clear(): Promise<void> {
    // Custom clear logic
  }

  async keys(): Promise<string[]> {
    // Custom keys listing
    return keys;
  }
}
```

## Storage Options

Configure storage behavior with options:

```typescript
const storage = new InMemoryStorage({
  namespace: 'namespace',
  encryption: 'true',
  ttl: '3600',
});
```

## Building

Run `nx build ssi-storage` to build the library.

## Running unit tests

Run `nx test ssi-storage` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-storage` to check if there are lint errors.

See [LICENSE](../../LICENSE).
