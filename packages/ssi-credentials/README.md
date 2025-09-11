# SSI Credentials

The `ssi-credentials` package provides core functionality for handling verifiable credentials in Self-Sovereign Identity (SSI) systems. It supports credential preparation, signing, verification, and schema validation, following standards like W3C Verifiable Credentials.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-credentials
```

## Key Components

### Core Classes

- `CredentialProcessor`: Main orchestrator for credential operations like preparation, signing, and verification.
- `Credential`: Represents a verifiable credential.
- `CredentialSchema`: Defines credential schemas for validation.

### Services

- `SchemaService`: Handles schema registration and validation.

### Utilities

- `JsonLdHandler`: Processes JSON-LD formatted credentials.
- `jsonLdCanonicalize`: Canonicalizes JSON-LD data.

### Interfaces and Types

- `ICredential`: Interface for credential objects.

## Basic Usage

### 1. Setup Dependencies

Initialize required components like DID resolver, schema validator, and signature provider.

```typescript
import {
  CredentialProcessor,
  CredentialFormatType,
  ICredential,
} from '@blockialabs/ssi-credentials';
import { KeyDIDResolver } from '@blockialabs/ssi-did-key';
import { SchemaService } from './services/SchemaService.js';
import { JsonLdHandler } from './utils/JsonLdHandler.js';

// Setup DID resolver
const didResolver = new KeyDIDResolver(/* key method */);

// Setup schema validator
const schemaValidator = new SchemaService();

// Setup JSON-LD handler
const jsonLdHandler = new JsonLdHandler();

// Setup signature provider (implement ISignatureProvider)
const signatureProvider = {
  sign: async (data: string) => {
    /* signing logic */
  },
  verify: async (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => {
    /* verification logic */
  },
};
```

### 2. Initialize CredentialProcessor

Create an instance with required dependencies.

```typescript
const credentialProcessor = new CredentialProcessor({
  didResolver,
  schemaValidator,
  formatHandlers: {
    [CredentialFormatType.JSON_LD]: jsonLdHandler,
  },
  signatureProviders: {
    Secp256k1: signatureProvider,
  },
});
```

### 3. Register a Schema

Define and register a credential schema for validation.

```typescript
const credentialSchema = {
  $id: 'https://example.com/schemas/identity.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'name'],
  additionalProperties: false,
};

schemaValidator.registerSchema(credentialSchema);
```

### 4. Prepare a Credential

Create and prepare a credential for issuance.

```typescript
const credentialData: ICredential = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  'id': 'http://example.com/credentials/1234',
  'type': ['VerifiableCredential', 'IdentityCredential'],
  'issuer': 'did:example:issuer123',
  'validFrom': new Date().toISOString(),
  'credentialSubject': {
    id: 'did:example:subject456',
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  'credentialSchema': {
    id: 'https://example.com/schemas/identity.json',
    type: 'JsonSchemaValidator2018',
  },
};

const preparedCredential = await credentialProcessor.prepareIssuance(credentialData, {});
```

### 5. Issue (Sign) the Credential

Add a proof to the credential.

```typescript
const signedCredential = await credentialProcessor.completeIssuance(preparedCredential, {
  signature: 'your-signature',
  verificationMethod: 'did:example:issuer123#keys-1',
  signatureType: 'Secp256k1',
});
```

## Examples

See the demo file for a complete example: [`credential-demo.ts`](src/lib/__demo__/credential-demo.ts).

## Building

Run `nx build ssi-credentials` to build the library.

## Running unit tests

Run `nx test ssi-credentials` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-credentials` to check if there are lint errors.

See [LICENSE](../../LICENSE).
