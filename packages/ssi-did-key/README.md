# SSI DID Key

The `ssi-did-key` package provides a complete implementation of the `did:key` method for Decentralized Identifiers (DIDs) as specified in the DID Core specification. The `did:key` method allows DIDs to be derived directly from cryptographic public keys, enabling self-sovereign identity without requiring external registries or resolvers.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-did-key
```

## Key Components

### Core Classes

- `KeyDIDMethod`: Implementation of the `did:key` method supporting create, resolve, and update operations
- `KeyDIDResolver`: DID resolver specifically for `did:key` DIDs

### Interfaces

- `KeyDIDPrepareOptions`: Options for preparing DID creation
- `KeyDIDCompleteOptions`: Options for completing DID operations

## Basic Usage

### 1. Setup KeyDID Method and Resolver

Initialize the DID method and resolver.

```typescript
import { KeyDIDMethod, KeyDIDResolver } from '@blockialabs/ssi-did-key';

// Create the DID method implementation
const keyDIDMethod = new KeyDIDMethod();

// Create the resolver
const keyDIDResolver = new KeyDIDResolver(keyDIDMethod);
```

### 2. Create a DID from a Public Key

Generate a DID directly from a cryptographic public key.

```typescript
// Your public key
const publicKeyHex = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

// Create the DID
const { did, didDocument } = await keyDIDMethod.create({
  publicKeyHex,
  signatureType: 'EcdsaSecp256k1Signature2019',
  keyId: 'controllerKey',
  signature: 'signature',
});

console.log('Created DID:', did);
// Output: did:key:zQ3shP2mP2UQHpB8H7J4KCk7Pg1YCVy9Q3X9ZGJGJGJGJGJ
```

### 3. Resolve a DID

Resolve any `did:key` DID to get its DID document.

```typescript
const resolutionResult = await keyDIDResolver.resolve(
  'did:key:zQ3shP2mP2UQHpB8H7J4KCk7Pg1YCVy9Q3X9ZGJGJGJGJGJ',
);

if (resolutionResult.didDocument) {
  console.log('DID Document:', resolutionResult.didDocument);
  console.log('Resolution Metadata:', resolutionResult.didResolutionMetadata);
} else {
  console.log('Resolution Error:', resolutionResult.didResolutionMetadata.error);
}
```

### 4. Update a DID Document

Update an existing DID document with new information.

```typescript
// Create an updated DID document
const updatedDocument = {
  ...didDocument,
  // Add services, verification methods, etc.
  service: [
    {
      id: `${did}#linked-domain`,
      type: 'LinkedDomains',
      serviceEndpoint: 'https://example.com',
    },
  ],
};

// Update the DID document
const updatedDIDDocument = await keyDIDMethod.update(did, updatedDocument, {
  publicKeyHex,
  signature: 'update-signature',
  keyId: 'controllerKey',
  signatureType: 'EcdsaSecp256k1Signature2019',
});
```

## DID Key Format

The `did:key` method uses the following format:

```
did:key:<method-specific-identifier>
```

Where `<method-specific-identifier>` is a base58-encoded representation of the public key.

## Integration with SSI DID Package

### Using with DID Orchestrator

Integrate with the main SSI DID package for full lifecycle management.

```typescript
import { DIDOrchestrator, DIDMethodRegistry, DIDResolverRegistry } from '@blockialabs/ssi-did';
import { KeyDIDMethod } from '@blockialabs/ssi-did-key';

// Setup registries
const methodRegistry = new DIDMethodRegistry();
const resolverRegistry = new DIDResolverRegistry();

// Register the key method
const keyMethod = new KeyDIDMethod();
methodRegistry.register('key', keyMethod);
resolverRegistry.register('key', keyMethod);

// Create orchestrator
const orchestrator = new DIDOrchestrator({
  methodRegistry,
  resolverRegistry,
  signatureProviders: {
    Secp256k1: secp256k1SignatureProvider,
  },
});
```

## Building

Run `nx build ssi-did-key` to build the library.

## Running unit tests

Run `nx test ssi-did-key` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-did-key` to check if there are lint errors.

See [LICENSE](../../LICENSE).
