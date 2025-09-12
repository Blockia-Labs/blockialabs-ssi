# Getting Started

Build Self-Sovereign Identity applications with TypeScript - the simple way.

## What is SSI?

**Self-Sovereign Identity** lets people own their digital credentials (like diplomas, licenses, certifications) without relying on centralized systems.

**Think of it like this:**
- **Universities issue** digital diplomas directly to students
- **Students store** credentials securely in their digital wallet  
- **Employers verify** credentials instantly without calling the university

## Four Core SDKs

We've made SSI development simple with four focused SDKs:

### Issuer SDK - Issue Credentials
**For:** Universities, employers, government agencies, certification bodies  
**Purpose:** Issue verifiable credentials following OpenID4VCI Draft-17 standards  
**Key Features:**
- Session management for OpenID4VCI flows
- Multiple credential formats (JSON-LD, JWT)
- Cryptographic proof validation from holders
- Deferred issuance workflows
- Builder patterns for offers, tokens, approvals

### Wallet SDK - Store & Manage Credentials  
**For:** Mobile apps, browser extensions, desktop wallets, user-facing applications  
**Purpose:** HD wallet with secure credential storage and DID management  
**Key Features:**
- BIP32/BIP39 hierarchical deterministic keys
- Encrypted mnemonic storage with PBKDF2 + AES
- DID generation and cryptographic operations
- Credential management and activity tracking
- JWT proof creation for presentations

### Verifier SDK - Verify Credentials
**For:** Employers, service providers, applications requiring identity verification  
**Purpose:** Complete OpenID4VP Draft-24 verification with presentation definitions  
**Key Features:**
- Presentation definition creation with constraints
- QR code generation for mobile wallet interaction
- Cryptographic verification of credentials and signatures
- OAuth2-style token exchange after verification
- Session management for verification flows

### DID Core SDK - Identity Infrastructure
**For:** All applications - this is the foundation that powers the other SDKs  
**Purpose:** Universal DID operations supporting multiple DID methods  
**Key Features:**
- DID:key method for cryptographic self-sovereign identities  
- DID:web method for web-based decentralized identities
- DID document creation, validation, and management
- Universal DID resolution across methods
- Integration with W3C DID specifications

## Why Developers Love It

**Real APIs** - All examples use actual working code from the packages  
**TypeScript first** - Complete type safety and IntelliSense  
**Standards compliant** - W3C Verifiable Credentials, OpenID4VCI Draft-17, OpenID4VP Draft-24  
**Production ready** - Professional architecture with proper abstractions  
**Framework agnostic** - Works with React, Vue, Express, Next.js

**Note:** The examples above show the actual APIs. Each SDK requires some setup, but the complexity is hidden behind well-designed abstractions. The "Quick Start" sections in each SDK guide show minimal working examples.  

## Get Started Now

Choose your path:

### I want to issue credentials
→ [Issuer SDK Guide](./sdks/issuer-sdk)

### I want to build a wallet  
→ [Wallet SDK Guide](./sdks/wallet-sdk)

### I want to verify credentials
→ [Verifier SDK Guide](./sdks/verifier-sdk)

### I want to work with DIDs directly
→ [DID Core SDK](./sdks/did-core)

### I want to understand the architecture
→ [Package Overview](./architecture/package-overview)