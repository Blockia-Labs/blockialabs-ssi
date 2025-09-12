# DID Core SDK

The foundational SDK for DID (Decentralized Identifier) operations. This is the core infrastructure that powers all other SDKs.

**Architecture:**
- `ssi-did` - Core DID SDK with universal operations
- `ssi-did-key` - DID Key method implementation  
- `ssi-did-web` - DID Web method implementation

```bash
npm install @blockialabs/ssi-did @blockialabs/ssi-did-key @blockialabs/ssi-did-web
```

## Quick Start (3 Steps)

Create and manage DIDs:

```typescript
import { DIDOrchestrator, DIDMethodRegistry, DIDResolverRegistry } from '@blockialabs/ssi-did';
import { KeyDIDMethod, KeyDIDResolver } from '@blockialabs/ssi-did-key';

// 1. Setup registries (actual API)
const methodRegistry = new DIDMethodRegistry();
const resolverRegistry = new DIDResolverRegistry();

// Register DID methods
const keyMethod = new KeyDIDMethod();
methodRegistry.register('key', keyMethod);
resolverRegistry.register('key', new KeyDIDResolver(keyMethod));

// 2. Create orchestrator
const orchestrator = new DIDOrchestrator({
  methodRegistry,
  resolverRegistry
});

// 3. Create DID using direct method
const keyDid = await keyMethod.create({
  publicKeyHex: '04a8b8d7e4c...'  // Your public key
});
```

> **Perfect!** You now have decentralized identity infrastructure.

---

## Advanced DID Operations

### Multiple DID Methods

```typescript
import { WebDIDMethod, WebDIDResolver } from '@blockialabs/ssi-did-web';

// Add web DID support - register additional methods
const webMethod = new WebDIDMethod();
methodRegistry.register('web', webMethod);
resolverRegistry.register('web', new WebDIDResolver(webMethod));

// Create web-based DID using method directly
const webDid = await webMethod.create({
  domain: 'issuer.example.com',
  publicKeyHex: '04a8b8d7e4c...'
});

console.log('Web DID:', webDid.did); // did:web:issuer.example.com
```

### DID Resolution

```typescript
import { DIDResolverRegistry, KeyDIDResolver } from '@blockialabs/ssi-did';

// Setup universal resolver
const resolverRegistry = new DIDResolverRegistry();
resolverRegistry.register('key', new KeyDIDResolver(new KeyDIDMethod()));

// Resolve any DID
const result = await resolverRegistry.resolve('did:key:z6Mk...');
console.log('DID Document:', result.didDocument);
```

### DID Validation

```typescript
import { DIDStringValidator } from '@blockialabs/ssi-did';

const validator = new DIDStringValidator();

const dids = [
  'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
  'did:web:example.com',
  'invalid:did:string'
];

dids.forEach(did => {
  const isValid = validator.validate(did);
  console.log(`${did}: ${isValid ? 'Valid' : 'Invalid'}`);
});
```

### Document Updates

```typescript
// Add services to existing DID document
const updatedDoc = new DIDDocumentBuilder(existingDid)
  .addService({
    id: '#messaging-service',
    type: 'MessagingService',
    serviceEndpoint: 'https://example.com/messages'
  })
  .addVerificationMethod({
    id: '#key-2',
    type: 'Ed25519VerificationKey2020',
    controller: existingDid,
    publicKeyMultibase: 'z6MkhaXgBZDvotDkL...'
  })
  .build();
```