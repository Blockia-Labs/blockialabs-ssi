# Verifier SDK

Complete OpenID4VP Draft-24 verification with presentation definitions, token exchange, and signature validation.

```bash
npm install @blockialabs/ssi-verifier-sdk
```

## Building Blocks Overview

The `VerifierSDK` is built from these components:

```
VerifierSDK
├── Storage Layer (sessions, tokens, definitions)
├── CredentialProcessor (verifies VC signatures & schemas)  
│   ├── DIDResolver (resolves holder & issuer DIDs)
│   ├── SchemaValidator (validates credential schemas)
│   ├── FormatHandlers (handles JSON-LD, JWT formats)
│   └── SignatureProviders (verifies signatures)
└── HolderDIDResolver (specifically resolves holder DIDs)
```

Let's build each component step by step:

## Step 1: Storage Infrastructure 

**What it does:** Manages verification sessions, OAuth tokens, and presentation definitions.

```typescript
import { InMemoryStorage } from '@blockialabs/ssi-storage';

const storage = {
  transactions: new InMemoryStorage(),    // Track verification sessions
  tokens: new InMemoryStorage(),          // OAuth access/refresh tokens
  presentations: new InMemoryStorage()    // Cached presentation definitions
};
```

**Why you need it:** OpenID4VP Draft-24 requires session state management between request and response.

## Step 2: DID Resolution

**What it does:** Resolves DIDs to get public keys for signature verification.

```typescript
import { KeyDIDResolver, KeyDIDMethod } from '@blockialabs/ssi-did-key';

const holderDidResolver = new KeyDIDResolver(new KeyDIDMethod());
```

**Why you need it:** To verify that credentials and proofs are signed by the claimed holder DID.

## Step 3: Credential Processor

**What it does:** The core engine that verifies credential signatures and validates schemas.

```typescript
import { CredentialProcessor, JsonLdHandler } from '@blockialabs/ssi-credentials';

const credentialProcessor = new CredentialProcessor({
  didResolver: holderDidResolver,        // From Step 2
  schemaValidator,                       // Validates credential structure  
  formatHandlers: {
    'ldp_vc': new JsonLdHandler()
  },
  signatureProviders                     // Verifies cryptographic signatures
});
```

**Why you need it:** This handles the complex W3C VC verification and ensures credentials are authentic.

## Step 4: Create Verifier SDK

**What it does:** Combines all components into a working OpenID4VP verifier.

```typescript
import { VerifierSDK } from '@blockialabs/ssi-verifier-sdk';

const verifier = VerifierSDK.create({
  baseUrl: 'https://acme-corp.com/verify',
  clientId: 'acme-corp-verifier',
  credentialProcessor,      // From Step 3
  holderDidResolver,        // From Step 2  
  storage                   // From Step 1
});
```

**Why these are needed:** Each component handles a specific part of the verification process.

## Step 5: Define Requirements

**What it does:** Specifies exactly what credentials you want from the user.

```typescript
const presentationDefinition = await verifier.createPresentationDefinition({
  credentialTypes: ['UniversityDegree'],
  constraints: [{
    fields: [{ 
      path: ['$.credentialSubject.degree'],
      purpose: 'We need to verify your degree field'
    }]
  }]
});
```

**Why this matters:** Clear requirements help users understand what they need to share.

## Step 6: Verification Flow

**What happens:** Create request → User scans QR → Verify presentation → Issue tokens.

```typescript
// Create authorization request with QR code
const authRequest = await verifier.createAuthorizationRequest({
  presentationDefinition,
  nonce: crypto.randomUUID()
});
console.log('QR Code URL:', authRequest.openId4VPUrl);

// Verify when user responds
const result = await verifier.verifyPresentation({
  vpToken: presentationFromWallet,
  presentationSubmission,
  state: authRequest.state
});

console.log('Verified:', result.verified);
```

**Behind the scenes:**
1. Verifier creates secure challenge nonce
2. User scans QR code with wallet app
3. Wallet presents requested credentials
4. Verifier validates signatures & schemas
5. Returns success/failure with verified claims

---

## Advanced Verification

### Complex Presentation Requirements

```typescript
// Define multiple credential requirements
const presentationDefinition = await verifier.createPresentationDefinition({
  credentialTypes: ['IdentityCredential', 'AgeCredential'],
  constraints: [
    {
      fields: [
        { 
          path: ['$.credentialSubject.given_name'],
          purpose: 'Legal name verification'
        },
        {
          path: ['$.credentialSubject.birth_date'],
          purpose: 'Age verification (18+)',
          filter: { type: 'string', format: 'date' }
        }
      ]
    }
  ]
});
```

### Authorization Request with Metadata

```typescript
const authRequest = await verifier.createAuthorizationRequest({
  presentationDefinition,
  nonce: crypto.randomUUID(),
  state: crypto.randomUUID(),
  clientMetadata: {
    client_name: 'Acme Corp Verifier',
    logo_uri: 'https://acme-corp.com/logo.png'
  }
});

console.log('Authorization URL:', authRequest.openId4VPUrl);
```

### Token Exchange

```typescript
// After successful verification, exchange for tokens
const tokenResponse = await verifier.exchangeCodeForToken({
  responseCode: verificationResult.responseCode,
  clientId: 'acme-corp-verifier'
});

console.log('Access token received:', tokenResponse.access_token);
```

### Token Refresh

```typescript
// Refresh expired tokens
const refreshedTokens = await verifier.refreshTokens({
  refreshToken: tokenResponse.refresh_token,
  clientId: 'acme-corp-verifier'
});
```