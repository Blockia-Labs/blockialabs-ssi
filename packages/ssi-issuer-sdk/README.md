# SSI Issuer SDK

The `ssi-issuer-sdk` package provides a comprehensive SDK for issuing and managing verifiable credentials in Self-Sovereign Identity (SSI) systems. It implements the OpenID for Verifiable Credential Issuance (OpenID4VCI) specification, enabling secure and interoperable credential issuance flows.

## Installation

Install the package via NPM:

```bash
npm install @blockialabs/ssi-issuer-sdk
```

## Key Components

### Core Classes

- `CredentialIssuer`: Main orchestrator for credential issuance operations
- `OfferBuilder`: Builder for creating credential offers
- `RequestBuilder`: Builder for handling credential requests
- `ApprovalBuilder`: Builder for credential approval responses
- `RejectBuilder`: Builder for rejection responses
- `RevocationBuilder`: Builder for credential revocation
- `TokenBuilder`: Builder for access tokens

### Services

- `IssuerSessionManager`: Manages issuance sessions and state
- `JWTProofValidator`: Validates JWT proofs from holders
- `NonceStorage`: Manages cryptographic nonces for proof validation
- `SchemaVerifier`: Validates credential schemas
- `SessionInMemoryStorage`: In-memory session storage implementation

### Interfaces

- `IIssuerKeyStore`: Interface for issuer key management
- `IProofValidator`: Interface for proof validation
- `ISessionManager`: Interface for session management
- `IVCRepository`: Interface for verifiable credential storage

### Utilities

- `generateQRCode`: Generate QR codes for credential offers
- `createCredentialOfferURI`: Create URIs for credential offers

## Basic Usage

### 1. Setup Issuer Configuration

Configure your issuer according to OpenID4VCI specification.

```typescript
import { CredentialIssuer, IssuerConfig } from '@blockialabs/ssi-issuer-sdk';

const issuerConfig: IssuerConfig = {
  credential_issuer: 'https://issuer.example.com',
  credential_endpoint: 'https://issuer.example.com/credential',
  credential_configurations_supported: {
    UniversityDegree: {
      format: 'jwt_vc_json',
      credential_definition: {
        type: ['VerifiableCredential', 'UniversityDegreeCredential'],
      },
      scope: 'UniversityDegree',
      cryptographic_binding_methods_supported: ['did:key'],
      credential_signing_alg_values_supported: ['ES256K'],
      proof_types_supported: {
        jwt: {
          proof_signing_alg_values_supported: ['ES256K'],
        },
      },
    },
  },
};
```

### 2. Initialize Dependencies

Set up required services and dependencies.

```typescript
import {
  IssuerSessionManager,
  JWTProofValidator,
  SessionInMemoryStorage,
} from '@blockialabs/ssi-issuer-sdk';
import { CredentialProcessor } from '@blockialabs/ssi-credentials';

// Setup session management
const sessionStorage = new SessionInMemoryStorage();
const sessionManager = new IssuerSessionManager(sessionStorage);

// Setup proof validation
const proofValidator = new JWTProofValidator();

// Setup credential processor
const credentialProcessor = new CredentialProcessor({
  // ... credential processor configuration
});

// Setup signature provider
const signatureProvider = {
  sign: async (data: string) => {
    /* signing logic */
  },
  verify: async (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => {
    /* verification logic */
  },
};
```

### 3. Create Credential Issuer

Initialize the main credential issuer instance.

```typescript
const issuer = new CredentialIssuer(issuerConfig, {
  sessionManager,
  credentialProcessor,
  proofValidators: new Map([['jwt', proofValidator]]),
  signatureProvider,
  // Optional: revocationManager, keyStore
});
```

### 4. Create Credential Offer

Generate a credential offer for issuance.

```typescript
import { OfferBuilder } from '@blockialabs/ssi-issuer-sdk';

const offerBuilder = new OfferBuilder({
  credentialTypes: ['UniversityDegree'],
  preAuthorizedCode: 'pre-auth-123',
});

const offerResult = await offerBuilder.build();

// Generate QR code for the offer
const qrCode = await offerResult.generateQRCode();
console.log('Credential Offer URI:', offerResult.uri);
console.log('QR Code:', qrCode);
```

### 5. Credential Submit

Process a credential request from a holder.

```typescript
// Receive credential request from holder
const credentialRequest = {
  // ... credential request data
};

// Validate and process the request
const tokenResponse = await issuer.processTokenRequest({
  'grant_type': 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
  'pre-authorized_code': 'pre-auth-123',
});

// Handle the credential request
const credentialResponse = await issuer.submitCredentialRequest({
  credentialRequest: credentialRequest,
  // ... other options
});
```

### 6. Credential Approve/Reject

Issuer approves or rejects

```typescript
const credentialResponse = await issuer.approveCredentialRequest(transactionId, {
  // ... options
});

const credentialResponse = await issuer.rejectCredentialRequest(transactionId, {
  // ... options
});
```

## Examples

See the demo file for comprehensive examples:

- [`credential-offer-demo.ts`](src/lib/__demo__/credential-offer-demo.ts)

## Building

Run `nx build ssi-issuer-sdk` to build the library.

## Running unit tests

Run `nx test ssi-issuer-sdk` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-issuer-sdk` to check if there are lint errors.

See [LICENSE](../../LICENSE).
