# SSI Types

The `ssi-types` package provides foundational TypeScript types and interfaces for Self-Sovereign Identity (SSI) systems. It defines common data structures, cryptographic interfaces, and type definitions used across the SSI SDK ecosystem.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-types
```

## Key Components

### Core Types

- `KeyFormat`: Supported key formats ('JWK' | 'Raw')
- `KeyType`: Supported cryptographic key types ('JsonWebKey' | 'Ed25519' | 'Secp256k1')
- `Signature`: Union type for signature representations
- `JWK`: JSON Web Key format specification

### Interfaces

- `ISignatureProvider`: Interface for cryptographic signing and verification operations

## Basic Usage

### Implementing ISignatureProvider

```typescript
import { ISignatureProvider } from '@blockialabs/ssi-types';

class CustomSignatureProvider implements ISignatureProvider {
  async sign(
    message: Uint8Array | string,
    publicKey: Uint8Array | string | bigint,
    options?: Record<string, unknown>,
  ): Promise<string> {
    // Custom signing implementation
    // Return signature as string (base64/hex)
    return 'signature-string';
  }

  async verify(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    options?: Record<string, unknown>,
  ): Promise<boolean> {
    // Custom verification implementation
    // Return true if signature is valid
    return true;
  }
}
```

### Using Signature Providers

```typescript
// Create provider instance
const provider = new CustomSignatureProvider();

// Sign a message
const message = new TextEncoder().encode('Hello, World!');
const signature = await provider.sign(message, privateKey);

// Verify a signature
const isValid = await provider.verify(signature, message, publicKey);
```

## Integration Examples

### With SSI Credentials

```typescript
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { CredentialProcessor } from '@blockialabs/ssi-credentials';

// Configure credential processor with signature providers
const processor = new CredentialProcessor({
  // ... other config
  signatureProviders: {
    customProvider: CustomSignatureProvider,
  },
});
```

### With SSI DID

```typescript
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { DIDOrchestrator } from '@blockialabs/ssi-did';

// Configure DID orchestrator with signature providers
const orchestrator = new DIDOrchestrator({
  methodRegistry,
  resolverRegistry,
  signatureProviders: {
    customProvider: CustomSignatureProvider,
  },
});
```

## Building

Run `nx build ssi-types` to build the library.

## Running unit tests

Run `nx test ssi-types` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-types` to check if there are lint errors.

See [LICENSE](../../LICENSE).
