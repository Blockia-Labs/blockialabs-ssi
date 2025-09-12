# SSI Revocation

The `ssi-revocation` package provides functionality for managing the revocation of verifiable credentials in Self-Sovereign Identity (SSI) systems. It implements the W3C Bitstring Status List specification for efficient credential status checking.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-revocation
```

## Key Components

### Core Classes

- `RevocationCore`: Main implementation for credential revocation operations

### Interfaces

- `IRevocationManager`: Interface for revocation management
- `RevokeCredentialRequest`: Request structure for revocation operations
- `BitstringStatusListEntry`: Status list entry following W3C specification

### Types

- `RevocationRecord`: Data structure for storing revocation information
- `StatusPurpose`: Enum for status purposes (revocation, suspension, etc.)

## Basic Usage

### 1. Setup Revocation Manager

Initialize the revocation core with storage.

```typescript
import { RevocationCore } from '@blockialabs/ssi-revocation';
import { MemoryStorage } from '@blockialabs/ssi-storage';

// Setup storage for revocation records
const storage = new MemoryStorage();

// Create revocation manager
const revocationManager = new RevocationCore(storage);
```

### 2. Revoke a Credential

Revoke a credential by providing the credential ID and revoker DID.

```typescript
const revokeRequest = {
  credentialId: 'credential-123',
  revokerDID: 'did:example:issuer123',
  reason: 'Credential compromised',
};

await revocationManager.revokeCredential(revokeRequest);
```

### 3. Check Credential Status

Check if a credential has been revoked.

```typescript
const status = await revocationManager.getStatusList('credential-123');

if (status === 'revocation') {
  console.log('Credential has been revoked');
} else {
  console.log('Credential is valid');
}
```

## Integration with Issuer SDK

### Using with Credential Issuer

The revocation manager integrates seamlessly with the issuer SDK:

```typescript
import { CredentialIssuer } from '@blockialabs/ssi-issuer-sdk';
import { RevocationCore } from '@blockialabs/ssi-revocation';

// Setup revocation manager
const revocationManager = new RevocationCore(storage);

// Include in issuer options
const issuer = new CredentialIssuer(config, {
  revocationManager,
  // ... other options
});
```

## Security Features

### Authorization Checks

The package enforces that only the original issuer can revoke a credential:

```typescript
// This will throw an error if revokerDID doesn't match the original issuer
await revocationManager.revokeCredential({
  credentialId: 'credential-123',
  revokerDID: 'did:example:unauthorized', // Must match original issuer
});
```

### Status Validation

Prevents double revocation and validates credential existence:

```typescript
// Throws error if credential doesn't exist
await revocationManager.getStatusList('non-existent-id');

// Throws error if already revoked
await revocationManager.revokeCredential({
  credentialId: 'already-revoked-credential',
  revokerDID: 'did:example:issuer123',
});
```

## Building

Run `nx build ssi-revocation` to build the library.

## Running unit tests

Run `nx test ssi-revocation` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-revocation` to check if there are lint errors.

See [LICENSE](../../LICENSE).
