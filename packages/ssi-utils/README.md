# SSI Utils

The `ssi-utils` package provides essential utility functions for Self-Sovereign Identity (SSI) systems. It includes cryptographic utilities, JWT proof generation, and signature providers for both custodial and non-custodial signing scenarios.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-utils
```

## Key Components

### JWT Proof Generation

- `generateJwtProof`: Generate JWT proofs for OpenID4VCI credential issuance

### Signature Providers

- `KmsProvider`: Custodial signature provider for KMS integration
- `Secp256k1Provider`: Non-custodial signature provider for wallet operations

### Verification Utilities

- `verifySignature`: Signature verification utility with detailed error messages

## Basic Usage

### JWT Proof Generation

Generate JWT proofs for OpenID4VCI credential requests:

```typescript
import { generateJwtProof } from '@blockialabs/ssi-utils';

// Generate a JWT proof for credential issuance
const jwtProof = await generateJwtProof(
  'private-key-hex', // Private key in hex format
  'did:example:holder123', // Holder DID
  'did:example:issuer456', // Issuer DID
  'nonce-from-issuer', // Nonce from issuer
);

console.log('JWT Proof:', jwtProof);
// Output: eyJhbGciOiJFUzI1NiIsInR5cCI6Im9wZW5pZDR2Y2ktcHJvb2Yrand0Iiwia2lkIjoiZGlkOmV4YW1wbGU6aG9sZGVyMTIzI2NvbnRyb2xsZXJLZXkifQ.eyJpc3MiOiJkaWQ6ZXhhbXBsZTpob2xkZXIxMjMiLCJhdWQiOiJkaWQ6ZXhhbXBsZTppc3N1ZXI0NTYiLCJpYXQiOjE2MzgzNjgwMDAsIm5vbmNlIjoibm9uY2UtZnJvbS1pc3N1ZXIifQ
```

### Using Secp256k1 Provider

Non-custodial signing operations:

```typescript
import { Secp256k1Provider } from '@blockialabs/ssi-utils';

// Create provider instance
const provider = new Secp256k1Provider();

// Sign a message
const message = new TextEncoder().encode('Hello, World!');
const privateKey = 'your-private-key-hex';
const signature = await provider.sign(message, privateKey);

console.log('Signature:', signature);

// Verify a signature
const publicKey = 'your-public-key-hex-bytes';
const isValid = await provider.verify(signature, message, publicKey);

console.log('Signature valid:', isValid);
```

### Using KMS Provider

For custodial signing with Key Management Services:

```typescript
import { KmsProvider } from '@blockialabs/ssi-utils';

// Create KMS provider with your KMS implementation
const kmsProvider = new KmsProvider(yourKmsImplementation);

// The KMS provider expects keyId references, not actual private keys
const keyId = 'kms-key-reference';
const signature = await kmsProvider.sign(message, keyId);

// Verification works the same way
const isValid = await kmsProvider.verify(signature, message, publicKey);
```

### Signature Verification

Use the verification utility if you have custom provider:

```typescript
import { verifySignature } from '@blockialabs/ssi-utils';

try {
  await verifySignature(
    signatureProvider,
    'base64-signature',
    'message-to-verify',
    'public-key-hex',
    { skipHashing: false },
  );

  console.log('Signature is valid');
} catch (error) {
  console.error('Verification failed:', error.message);
  // Error provides detailed information about what went wrong
}
```

## Integration Examples

### With SSI Issuer SDK

```typescript
import { CredentialIssuer } from '@blockialabs/ssi-issuer-sdk';
import { Secp256k1Provider } from '@blockialabs/ssi-utils';

// Setup signature provider
const signatureProvider = new Secp256k1Provider();

// Configure issuer with signature provider
const issuer = new CredentialIssuer(config, {
  signatureProvider,
  // ... other options
});
```

### With SSI Credentials

```typescript
import { CredentialProcessor } from '@blockialabs/ssi-credentials';
import { KmsProvider } from '@blockialabs/ssi-utils';

// Setup KMS provider for credential processing
const kmsProvider = new KmsProvider(yourKmsImplementation);

const processor = new CredentialProcessor({
  // ... other config
  signatureProviders: {
    kmsProvider: kmsProvider,
  },
});

// Process credentials with KMS-backed signing
const signedCredential = await processor.issue(credential, options);
```

### With SSI DID

```typescript
import { DIDOrchestrator } from '@blockialabs/ssi-did';
import { Secp256k1Provider } from '@blockialabs/ssi-utils';

// Setup signature provider for DID operations
const secpSignatureProvider = new Secp256k1Provider();

const orchestrator = new DIDOrchestrator({
  methodRegistry,
  resolverRegistry,
  signatureProviders: {
    Secp256k1: secpSignatureProvider,
  },
});

// Create DID with wallet-based signing
const { did, didDocument } = await orchestrator.completeDid('key', options);
```

## Building

Run `nx build ssi-utils` to build the library.

## Running unit tests

Run `nx test ssi-utils` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-utils` to check if there are lint errors.

See [LICENSE](../../LICENSE).
