# SSI DID

The `ssi-did` package provides comprehensive functionality for creating, managing, and resolving Decentralized Identifiers (DIDs) in Self-Sovereign Identity (SSI) systems. It supports the W3C DID Core specification and provides a flexible architecture for different DID methods.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-did
```

## Key Components

### Core Classes

- `DIDOrchestrator`: Main orchestrator for DID lifecycle operations (create, update, resolve)
- `DIDDocumentBuilder`: Builder pattern for constructing DID documents
- `DIDStringBuilder`: Builder for creating DID strings according to W3C specification
- `DIDDocumentVerifier`: Verification utilities for DID documents
- `DIDStringValidator`: Validation utilities for DID strings

### Registry System

- `DIDMethodRegistry`: Registry for managing different DID methods
- `DIDResolverRegistry`: Registry for managing DID resolvers

### Interfaces

- `IDIDDocument`: Core interface for DID documents
- `IVerificationMethod`: Interface for verification methods
- `IService`: Interface for service endpoints
- `IProof`: Interface for cryptographic proofs
- `IDIDMethod`: Interface for DID method implementations
- `IDIDResolver`: Interface for DID resolution

## Basic Usage

### 1. Setup Registries and Orchestrator

Initialize the required registries and orchestrator.

```typescript
import { DIDOrchestrator, DIDMethodRegistry, DIDResolverRegistry } from '@blockialabs/ssi-did';
import { KeyDIDMethod } from '@blockialabs/ssi-did-key';

// Setup registries
const methodRegistry = new DIDMethodRegistry();
const resolverRegistry = new DIDResolverRegistry();

// Register DID methods (example with did:key)
const keyMethod = new KeyDIDMethod();
methodRegistry.register('key', keyMethod);
resolverRegistry.register('key', keyMethod);

// Setup orchestrator
const orchestrator = new DIDOrchestrator({
  methodRegistry,
  resolverRegistry,
  signatureProviders: {
    // Register signature providers for different algorithms
    Ed25519: ed25519SignatureProvider,
    Secp256k1: secp256k1SignatureProvider,
  },
});
```

### 2. Create a DID

Prepare and complete DID creation.

```typescript
// Step 1: Prepare DID creation (get message to sign)
const { message, serializedPayload } = await orchestrator.prepareDid('key', {
  publicKeyHex: 'your-public-key-hex',
  signatureType: 'Ed25519',
});

// Step 2: Sign the message
const signature = await signatureProvider.sign(message, privateKey);

// Step 3: Complete DID creation
const { did, didDocument } = await orchestrator.completeDid('key', {
  publicKeyHex: 'your-public-key-hex',
  signature,
  signatureType: 'Ed25519',
  serializedPayload,
});

console.log('Created DID:', did);
```

### 3. Resolve a DID

Resolve a DID to get its document.

```typescript
const resolutionResult = await orchestrator.resolve(did);
console.log('DID Document:', resolutionResult.didDocument);
```

### 4. Update a DID Document

Prepare and complete DID document updates.

```typescript
// Create updated document
const updatedDocument = {
  ...didDocument,
  // Add new verification method, service, etc.
};

// Prepare update
const { message, serializedPayload } = await orchestrator.prepareUpdate(
  'key',
  did,
  updatedDocument,
  {
    publicKeyHex: 'your-public-key-hex',
    signatureType: 'Ed25519',
  },
);

// Sign the update message
const signature = await signMessage(message, privateKey);

// Complete the update
const updateResult = await orchestrator.completeUpdate('key', did, {
  updatedDocument,
  signature,
  signatureType: 'Ed25519',
  serializedPayload,
});
```

## DID Document Management

### Building DID Documents

Use the `DIDDocumentBuilder` to construct DID documents programmatically.

```typescript
import { DIDDocumentBuilder } from '@blockialabs/ssi-did';

const builder = DIDDocumentBuilder.create('did:key:z6Mkabcd...');

// Add verification methods
builder.addVerificationMethod({
  id: `${did}#keys-1`,
  type: 'Ed25519VerificationKey2020',
  controller: did,
  publicKeyMultibase: 'z6Mkabcd...',
});

// Add services
builder.addService({
  id: `${did}#linked-domain`,
  type: 'LinkedDomains',
  serviceEndpoint: 'https://example.com',
});

// Build the document
const didDocument = builder.build();
```

### Building DID Strings

Use the `DIDStringBuilder` to construct DID strings.

```typescript
import { DIDStringBuilder } from '@blockialabs/ssi-did';

const didString = DIDStringBuilder.create('key')
  .withMethodSpecificIdentifier('z6Mkabcd...')
  .withFragment('keys-1')
  .build();

console.log('DID:', didString); // did:key:z6Mkabcd...#keys-1
```

## DID Method Implementation

### Creating Custom DID Methods

Implement the `IDIDMethod` interface for custom DID methods.

```typescript
import { IDIDMethod, IDIDDocument } from '@blockialabs/ssi-did';

class CustomDIDMethod implements IDIDMethod {
  async create(options: any): Promise<{ did: string; didDocument: IDIDDocument }> {
    // Implementation for creating DID
    const did = `did:custom:${generateIdentifier()}`;
    const didDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      'id': did,
      // ... other document properties
    };
    return { did, didDocument };
  }

  async update(did: string, document: IDIDDocument): Promise<IDIDDocument> {
    // Implementation for updating DID document
    // ... update logic
    return updatedDocument;
  }

  async resolve(did: string): Promise<{ didDocument: IDIDDocument; metadata: any }> {
    // Implementation for resolving DID
    // ... resolution logic
    return { didDocument, metadata: {} };
  }
}
```

### Registering Custom Methods

Register your custom DID method with the registry.

```typescript
const customMethod = new CustomDIDMethod();
methodRegistry.register('custom', customMethod);
resolverRegistry.register('custom', customMethod);
```

## Verification and Validation

### DID Document Verification

Use the `DIDDocumentVerifier` to verify DID documents.

```typescript
import { DIDDocumentVerifier } from '@blockialabs/ssi-did';

const verifier = new DIDDocumentVerifier();

// Verify document
const isValid = verifier.verify(didDocument);
```

## Building

Run `nx build ssi-did` to build the library.

## Running unit tests

Run `nx test ssi-did` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-did` to check if there are lint errors.

See [LICENSE](../../LICENSE).
