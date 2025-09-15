# Issuer SDK

Issue verifiable credentials following OpenID4VCI Draft-17 standards.

```bash
npm install @blockialabs/ssi-issuer-sdk
```

## Building Blocks Overview

The `CredentialIssuer` is built from these components:

```
CredentialIssuer
├── SessionManager (manages OpenID4VCI sessions)
├── CredentialProcessor (signs & validates credentials)
│   ├── DIDResolver (resolves issuer/holder identities)
│   ├── SchemaValidator (validates credential schemas)
│   ├── FormatHandlers (handles JSON-LD, JWT formats)
│   └── SignatureProviders (cryptographic signing)
└── ProofValidators (validates holder proofs)
```

Let's build each component step by step:

## Step 1: Session Management

**What it does:** Tracks credential issuance sessions and prevents replay attacks.

```typescript
import { IssuerSessionManager, SessionInMemoryStorage } from '@blockialabs/ssi-issuer-sdk';

const sessionManager = new IssuerSessionManager(
  new SessionInMemoryStorage({ ttl: 300 })  // Sessions expire in 5 minutes
);
```

**Why you need it:** OpenID4VCI Draft-17 requires session state to link credential offers with actual issuance.

## Step 2: DID Infrastructure

**What it does:** Creates and resolves decentralized identifiers for the issuer.

```typescript
import { KeyDIDMethod, KeyDIDResolver } from '@blockialabs/ssi-did-key';
import { secp256k1 } from '@noble/curves/secp256k1.js';

// Generate issuer keys
const privateKey = secp256k1.utils.randomSecretKey();
const publicKey = secp256k1.getPublicKey(privateKey, true);

// Create issuer DID
const keyMethod = new KeyDIDMethod();
const issuerDid = await keyMethod.create({
  publicKeyHex: Buffer.from(publicKey).toString('hex')
});

// Setup DID resolution
const didResolver = new KeyDIDResolver(keyMethod);
```

**Why you need it:** Every credential must be signed by a verifiable issuer identity (DID).

## Step 3: Signature Provider

**What it does:** Provides cryptographic signing capabilities for credentials.

```typescript
const signatureProvider = {
  'Secp256k1': {
    sign: async (data: string) => {
      const dataBytes = new TextEncoder().encode(data);
      const messageHash = await crypto.subtle.digest('SHA-256', dataBytes);
      const signature = secp256k1.sign(new Uint8Array(messageHash), privateKey);
      return Buffer.from(signature).toString('hex');
    }
  }
};
```

**Why you need it:** Credentials must be cryptographically signed to be trusted and verifiable.

## Step 4: Credential Processor

**What it does:** The core engine that handles W3C Verifiable Credential processing.

```typescript
import { CredentialProcessor, JsonLdHandler } from '@blockialabs/ssi-credentials';

const credentialProcessor = new CredentialProcessor({
  didResolver,                    // From Step 2
  schemaValidator,               // Validates credential structure
  formatHandlers: {
    'ldp_vc': new JsonLdHandler()
  },
  signatureProviders            // From Step 3
});
```

**Why you need it:** This handles the complex W3C VC standards, signing, and format conversion.

## Step 5: Assemble the Issuer

**What it does:** Combines all components into a working credential issuer.

```typescript
import { CredentialIssuer, JWTProofValidator } from '@blockialabs/ssi-issuer-sdk';

// Real constructor pattern from working example
const issuer = new CredentialIssuer(issuerConfig, {
  sessionManager,
  credentialProcessor,
  proofValidators: new Map([['jwt', proofValidator]]),
  signatureProvider,
});
```

**Now you can issue credentials:**

```typescript
const response = await issuer.submitCredentialRequest({
  credentialRequest,
  credential: {
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: { name: 'Alice', degree: 'Computer Science' }
  },
  responseCNonce: 'nonce-123'
});
```

---

## Complete Setup

Need full production setup? Here's a step-by-step approach:

### Step 1: Setup Issuer Configuration

```typescript
import { IssuerConfig } from '@blockialabs/ssi-issuer-sdk';

// Real configuration structure from working example
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

### Step 2: Setup Dependencies

```typescript
import { 
  IssuerSessionManager, 
  SessionInMemoryStorage, 
  JWTProofValidator 
} from '@blockialabs/ssi-issuer-sdk';
import { CredentialProcessor } from '@blockialabs/ssi-credentials';

// Session management
const sessionStorage = new SessionInMemoryStorage();
const sessionManager = new IssuerSessionManager(sessionStorage);

// Proof validation
const proofValidator = new JWTProofValidator();

// Credential processing (with your implementations)
const credentialProcessor = new CredentialProcessor({
  didResolver: {} as any, // Your DID resolver implementation
  schemaValidator: {} as any, // Your schema validator
  formatHandlers: {}, // Your format handlers
  signatureProviders: {} // Your signature providers
});

// Signature provider
const signatureProvider = {
  sign: async (data: string) => 'signature-placeholder',
  verify: async () => true
};
```

### Step 3: Create Full Issuer

```typescript
// Using the actual constructor signature from working example
const issuer = new CredentialIssuer(issuerConfig, {
  sessionManager,
  credentialProcessor,
  proofValidators: new Map([['jwt', proofValidator]]),
  signatureProvider,
});
```

> **Pro Tip:** Start with the Quick Start above, then add components as needed.

### 4. Create Credential Offer

```typescript
// Create credential offer using the real method signature
const offerBuilder = issuer.createCredentialOfferBuilder({
  credentialTypes: ['UniversityDegree'],
  preAuthorizedCode: 'pre-auth-' + Date.now(),
});

console.log('Credential offer created with pre-authorized code');
```

### 5. Generate Nonce for Proofs

```typescript
// Generate nonce for JWT proof validation - real method from working example
const nonceResponse = await issuer.generateNonce({
  preAuthorizedCode: 'pre-auth-' + Date.now(),
  expiresIn: 3600
});
console.log('Generated c_nonce:', nonceResponse.c_nonce);
```

### 6. Process Token Request

```typescript
// Process token request - real method signature
const tokenResponse = await issuer.processTokenRequest({
  'grant_type': 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
  'pre-authorized_code': 'pre-auth-' + Date.now(),
});

if ('access_token' in tokenResponse) {
  console.log('Token issued successfully');
  console.log('Access token:', tokenResponse.access_token);
} else {
  console.error('Token error:', tokenResponse.error);
}
```

### 7. Issue Credential

```typescript
// Issue credential using the real method signature
const response = await issuer.submitCredentialRequest({
  credentialRequest,
  credential: {
    type: ['VerifiableCredential', 'UniversityDegree'],
    credentialSubject: { name: 'Alice', degree: 'Computer Science' }
  },
  responseCNonce: 'nonce-123'
});

console.log('Issued credential:', response.credential);
```

### 8. Deferred Credential Issuance

```typescript
// Create approval builder using real method signature
const approvalBuilder = issuer.createApprovalBuilder('transaction_123');
const approvalResponse = await approvalBuilder.build();

// Or use convenience method
const deferredResponse = await issuer.approveCredentialRequest(
  'transaction_123',
  { /* completion options */ }
);
```

### 9. Credential Rejection

```typescript
// Reject credential request using real method signature  
const rejectionResponse = await issuer.rejectCredentialRequest(
  'transaction_123',
  { 
    description: 'Document verification failed',
    code: 'invalid_proof'
  }
);
```

### 10. Credential Revocation

```typescript
// Create revocation builder using real method signature
const revocationBuilder = issuer.createRevocationBuilder(
  'credential_123', 
  'did:key:issuer'
);
const revocationResult = await revocationBuilder.revoke();
```

## Core Builder Classes

- **OfferBuilder**: Create structured credential offers with configurations and display metadata
- **TokenBuilder**: Handle OAuth2-style token exchanges with proof validation  
- **ApprovalBuilder**: Manage approval workflows for deferred credential issuance
- **RevocationBuilder**: Revoke credentials with proper status management
- **RejectBuilder**: Reject credential requests with detailed error responses