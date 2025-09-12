# SSI DID Web

The `ssi-did-web` package provides a complete implementation of the `did:web` method for Decentralized Identifiers (DIDs) as specified in the DID Core specification. The `did:web` method allows DIDs to be resolved using standard web infrastructure, where DID documents are hosted as HTTPS resources on web domains.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-did-web
```

## Key Components

### Core Classes

- `WebDIDMethod`: Implementation of the `did:web` method supporting create, resolve, and update operations
- `WebDIDResolver`: DID resolver specifically for `did:web` DIDs

### Interfaces

- `WebDIDPrepareOptions`: Options for preparing DID creation
- `WebDIDCompleteOptions`: Options for completing DID operations

## Basic Usage

### 1. Setup WebDID Method and Resolver

Initialize the DID method and resolver.

```typescript
import { WebDIDMethod, WebDIDResolver } from '@blockialabs/ssi-did-web';

// Create the DID method implementation
const webDIDMethod = new WebDIDMethod();

// Create the resolver
const webDIDResolver = new WebDIDResolver();
```

### 2. Create a DID for a Domain

Generate a DID for a web domain by publishing the DID document to `https://domain/.well-known/did.json`.

```typescript
// Your domain and public key
const domain = 'example.com';
const publicKeyHex = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

// Create the DID (this will attempt to publish to your domain)
const { did, didDocument } = await webDIDMethod.create({
  domain,
  publicKeyHex,
  signatureType: 'EcdsaSecp256k1Signature2019',
  keyId: 'controllerKey',
  signature: 'signature',
});

console.log('Created DID:', did);
// Output: did:web:example.com
```

### 3. Resolve a DID

Resolve any `did:web` DID by fetching its DID document from the web.

```typescript
const resolutionResult = await webDIDResolver.resolve('did:web:example.com');

if (resolutionResult.didDocument) {
  console.log('DID Document:', resolutionResult.didDocument);
  console.log('Resolution Metadata:', resolutionResult.didResolutionMetadata);
} else {
  console.log('Resolution Error:', resolutionResult.didResolutionMetadata.error);
}
```

### 4. Update a DID Document

Update an existing DID document and republish it to the domain.

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

// Update the DID document (this will republish to your domain)
const updatedDIDDocument = await webDIDMethod.update(did, updatedDocument, {
  publicKeyHex,
  signature: 'update-signature-hex',
  keyId: 'controllerKey',
  signatureType: 'EcdsaSecp256k1Signature2019',
});
```

## DID Web Format

The `did:web` method uses the following format:

```
did:web:<domain-name>
```

Where `<domain-name>` is a valid domain name that hosts the DID document.

## Integration with SSI DID Package

### Using with DID Orchestrator

Integrate with the main SSI DID package for full lifecycle management.

```typescript
import { DIDOrchestrator, DIDMethodRegistry, DIDResolverRegistry } from '@blockialabs/ssi-did';
import { WebDIDMethod } from '@blockialabs/ssi-did-web';

// Setup registries
const methodRegistry = new DIDMethodRegistry();
const resolverRegistry = new DIDResolverRegistry();

// Register the web method
const webMethod = new WebDIDMethod();
methodRegistry.register('web', webMethod);
resolverRegistry.register('web', webMethod);

// Create orchestrator
const orchestrator = new DIDOrchestrator({
  methodRegistry,
  resolverRegistry,
  signatureProviders: {
    Secp256k1: secp256k1SignatureProvider,
  },
});

// Now you can use the orchestrator for web DIDs
const { did, didDocument } = await orchestrator.completeDid('web', {
  domain: 'example.com',
  publicKeyHex: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
  signature: 'signature-hex',
  signatureType: 'Secp256k1',
  serializedPayload: 'payload-from-prepare',
});
```

### Using with DID Document Builder

Create custom DID documents using the builder pattern.

```typescript
import { DIDDocumentBuilder } from '@blockialabs/ssi-did';
import { WebDIDMethod } from '@blockialabs/ssi-did-web';

const webMethod = new WebDIDMethod();

// Create a basic DID
const { did } = await webMethod.create({
  domain: 'example.com',
  publicKeyHex: '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
});

// Build a custom document
const customDocument = DIDDocumentBuilder.create(did)
  .withContext(['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/v2'])
  .addService({
    id: `${did}#dwn`,
    type: 'DecentralizedWebNode',
    serviceEndpoint: 'https://dwn.example.com',
  })
  .addService({
    id: `${did}#verifiable-credentials`,
    type: 'VerifiableCredentialService',
    serviceEndpoint: 'https://vc.example.com/issue',
  })
  .build();
```

## Building

Run `nx build ssi-did-web` to build the library.

## Running unit tests

Run `nx test ssi-did-web` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-did-web` to check if there are lint errors.

See [LICENSE](../../LICENSE).
