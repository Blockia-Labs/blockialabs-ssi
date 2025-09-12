# SSI Schema

The `ssi-schema` package provides functionality for managing and validating JSON schemas in Self-Sovereign Identity (SSI) systems. It supports schema creation, validation, integrity checking, and storage with cryptographic digests for tamper detection.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-schema
```

## Key Components

### Core Classes

- `SchemaSdk`: Main SDK for schema operations (create, find, update, delete)
- `SchemaValidator`: Validates JSON schema structure and calculates SHA-384 digests
- `SchemaIntegrity`: Provides integrity checking for schemas

### Registry

- `DraftRegistry`: Registry for supported JSON Schema draft versions

### Interfaces

- `ISchemaStorage`: Interface for schema storage implementations

### Types

- `Schema`: Core schema data structure
- `JsonSchema`: JSON Schema specification types
- `ValidationResult`: Schema validation results

## Basic Usage

### 1. Setup Schema SDK

Initialize the schema SDK with storage.

```typescript
import { SchemaSdk } from '@blockialabs/ssi-schema';
import { MemoryStorage } from '@blockialabs/ssi-storage';

// Setup storage for schemas
const storage = new MemoryStorage();

// Create schema SDK
const schemaSdk = new SchemaSdk(storage);
```

### 2. Create a Schema

Create and validate a new JSON schema.

```typescript
const schemaData = {
  name: 'schema-name',
  schema: {
    $id: 'https://example.com/schemas/person.json',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number', minimum: 0 },
      email: { type: 'string', format: 'email' },
    },
    required: ['name', 'email'],
  },
  metadata: {
    name: 'Person Schema',
    description: 'Schema for person credentials',
    author: 'example.com',
    tags: ['person', 'identity'],
  },
  issuerId: 'issuerId',
};

const createdSchema = await schemaSdk.createSchema(schemaData);
console.log('Created schema:', createdSchema.id);
```

### 3. Find Schemas

Query and retrieve schemas from storage.

```typescript
// Find schema by ID
const schema = await schemaSdk.findSchemaById('schema-123');

// Find schemas with options
const filteredSchemas = await schemaSdk.findSchemas({
  issuerId: 'issuer-id,
  status: 'ACTIVE',
});
```

### 4. Validate Schema Structure

Validate a JSON schema against the specification.

```typescript
import { SchemaValidator } from '@blockialabs/ssi-schema';

const validator = new SchemaValidator();

const validationResult = validator.validateSchemaStructure(schemaData.schema);

if (validationResult.outcome === 'success') {
  console.log('Schema is valid');
} else {
  console.log('Validation errors:', validationResult.errors);
}
```

## Building

Run `nx build ssi-schema` to build the library.

## Running unit tests

Run `nx test ssi-schema` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-schema` to check if there are lint errors.

See [LICENSE](../../LICENSE).
