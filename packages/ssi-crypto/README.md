# SSI Crypto

The `ssi-crypto` package provides cryptographic primitives for Self-Sovereign Identity (SSI) systems. It supports key generation, signing, verification, and key management operations using industry-standard algorithms like Ed25519 and Secp256k1.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-crypto
```

## Key Components

### Core Classes

- `KeyManager`: Manages cryptographic keys including creation, rotation, import/export operations.
- `Signer`: Provides signing and verification functionality.
- `Key`: Represents cryptographic key pairs with support for Ed25519 and Secp256k1.

### Algorithms

- `Ed25519Algorithm`: Implementation of Ed25519 digital signature algorithm.
- `Secp256k1Algorithm`: Implementation of Secp256k1 elliptic curve cryptography.
- `SigningAlgorithmFactory`: Factory for creating algorithm instances.

### Storage

- `VaultKeyStore`: Secure key storage implementation using the SSI storage abstraction.
- `KeyRecord`: Data structure for storing key metadata.

### Interfaces

- `IKeyManager`: Interface for key management operations.
- `ISigner`: Interface for signing and verification operations.
- `IKeyStore`: Interface for key storage operations.
- `ISigningAlgorithm`: Interface for cryptographic algorithms.

## Basic Usage

### 1. Setup Key Storage

Initialize the key store and algorithm factory.

```typescript
import { VaultKeyStore, SigningAlgorithmFactory } from '@blockialabs/ssi-crypto';
import { MemoryStorage } from '@blockialabs/ssi-storage';

// Setup storage (you can use any IStorage implementation)
const storage = new MemoryStorage<KeyRecord>();
const keyStore = new VaultKeyStore(storage);

// Setup algorithm factory
const algorithmFactory = new SigningAlgorithmFactory();
```

### 2. Initialize Key Manager

Create a key manager instance.

```typescript
import { KeyManager } from '@blockialabs/ssi-crypto';

const keyManager = new KeyManager(keyStore, algorithmFactory);
```

### 3. Initialize Signer

Create a signer instance.

```typescript
import { Signer } from '@blockialabs/ssi-crypto';

const signer = new Signer(keyManager, algorithmFactory);
```

### 4. Create a Key

Generate a new cryptographic key.

```typescript
const key = await signer.createKey('Ed25519');
console.log('Created key with ID:', key.kid);
```

### 5. Sign a Message

Sign a message using the created key.

```typescript
const message = new TextEncoder().encode('Hello, World!');
const signature = await signer.sign(message, key);
console.log('Signature:', signature);
```

### 6. Verify a Signature

Verify the signature against the original message.

```typescript
const isValid = await signer.verify(signature, message, key);
console.log('Signature is valid:', isValid);
```

## Building

Run `nx build ssi-crypto` to build the library.

## Running unit tests

Run `nx test ssi-crypto` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-crypto` to check if there are lint errors.

See [LICENSE](../../LICENSE).
