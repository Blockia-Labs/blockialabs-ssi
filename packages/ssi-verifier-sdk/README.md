# SSI Verifier SDK

A comprehensive SDK for implementing verifiable credential verifiers in decentralized identity systems. This package provides tools for creating presentation requests, verifying credential presentations, and managing the complete OpenID4VP (OpenID for Verifiable Presentations) verification flow.

## Installation

```bash
npm install @blockialabs/ssi-verifier-sdk
```

## Quick Start

```typescript
import { VerifierSDK } from '@blockialabs/ssi-verifier-sdk';
import { InMemoryStorage } from '@blockialabs/ssi-storage';
import { CredentialProcessor } from '@blockialabs/ssi-credentials';
import { KeyDIDResolver } from '@blockialabs/ssi-did-key';

// Initialize storage
const transactionStorage = new InMemoryStorage();
const tokenStorage = new InMemoryStorage();
const presentationStorage = new InMemoryStorage();

// Create credential processor
const credentialProcessor = new CredentialProcessor({
  didResolver: new KeyDIDResolver(),
  // ... other configuration
});

// Initialize verifier SDK
const verifier = VerifierSDK.create({
  baseUrl: 'https://your-verifier.com',
  clientId: 'your-client-id',
  credentialProcessor,
  holderDidResolver: new KeyDIDResolver(),
  signingKey: 'your-private-key',
  signingKeyId: 'key-1',
  storage: {
    transactions: transactionStorage,
    tokens: tokenStorage,
    presentations: presentationStorage,
  },
});

// Create a presentation request
const presentationDefinition = await verifier.createPresentationDefinition({
  credentialTypes: ['IdentityCredential'],
  proofTypes: ['EcdsaSecp256k1Signature2019'],
});

// Create authorization request
const authRequest = await verifier.createAuthorizationRequest({
  presentationDefinition,
});

// Verify presentation response
const verificationResult = await verifier.verifyPresentation({
  vpToken: vpTokenString,
  presentationSubmission: submissionString,
  transactionId: authRequest.id,
});
```

### Token Exchange

Exchange verified presentations for access tokens:

```typescript
const tokenResponse = await verifier.exchangeCodeForToken({
  responseCode: verificationResult.responseCode,
});

console.log('Access Token:', tokenResponse.access_token);
console.log('Refresh Token:', tokenResponse.refresh_token);
console.log('Expires In:', tokenResponse.expires_in);
```

### Token Refresh

Refresh expired access tokens:

```typescript
const refreshResponse = await verifier.refreshTokens({
  refreshToken: tokenResponse.refresh_token,
  clientId: 'client-id',
});

console.log('New Access Token:', refreshResponse.access_token);
```

## Building

Run `nx build ssi-verifier-sdk` to build the library.

## Running unit tests

Run `nx test ssi-verifier-sdk` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-verifier-sdk` to check if there are lint errors.

See [LICENSE](../../LICENSE).
