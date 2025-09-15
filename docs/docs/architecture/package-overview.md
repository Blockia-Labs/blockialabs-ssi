# Package Architecture Overview

Understanding the complete Blockialabs SSI package ecosystem and how components work together.

## Package Categories

### Core SDKs (Primary Usage)

These are the 4 main SDK packages developers install and use directly:

#### **ssi-issuer-sdk** - Complete OpenID4VCI Issuer
- **Purpose**: Full-featured credential issuance with OpenID4VCI compliance
- **Key Components**: CredentialIssuer, Builder APIs, Session Management
- **Dependencies**: All supporting packages below
- **When to Use**: Building credential issuing applications (universities, employers, government)

#### **ssi-wallet-sdk** - HD Wallet & Credential Management  
- **Purpose**: Secure wallet for holding and managing credentials
- **Key Components**: WalletManager, Secure Storage, Multi-account HD derivation
- **Dependencies**: ssi-crypto, ssi-storage, ssi-did packages
- **When to Use**: Building mobile/web wallet applications for end users

#### **ssi-verifier-sdk** - OpenID4VP Verification
- **Purpose**: Verify credentials and presentations with full validation
- **Key Components**: VerifierSDK, Presentation Verification, Token Exchange
- **Dependencies**: ssi-credentials, ssi-did packages, validation libraries
- **When to Use**: Building applications that need to verify user credentials

#### **ssi-did** - DID Core SDK
- **Purpose**: Universal DID operations and method orchestration
- **Key Components**: DIDOrchestrator, DIDDocumentBuilder, Universal Resolution
- **Dependencies**: DID method implementations (ssi-did-key, ssi-did-web)
- **When to Use**: Building applications that need direct DID management

### DID Method Implementations

Specific DID method implementations that extend the core DID SDK:

#### **ssi-did** - W3C DID Core Implementation
- **Purpose**: Complete DID document management, resolution, and orchestration
- **Key Components**: DIDOrchestrator, DIDDocumentBuilder, Universal Resolution
- **Exports**: 40+ classes for comprehensive DID operations
- **Role**: Central identity infrastructure used by all other packages

#### **ssi-did-key** - Cryptographic DIDs
- **Purpose**: Self-sovereign DIDs based on cryptographic keys
- **Key Components**: KeyDIDMethod, KeyDIDResolver
- **Use Case**: Privacy-focused identities that don't require web infrastructure
- **Integration**: Primary DID method for wallets and standalone applications

#### **ssi-did-web** - Web-Based DIDs  
- **Purpose**: DIDs resolved via HTTPS from web domains
- **Key Components**: WebDIDMethod, WebDIDResolver
- **Use Case**: Institutional identities with web presence (issuer.university.edu)
- **Integration**: Primary DID method for organizations and services

### Core Libraries (Foundation Layer)

Essential building blocks used by SDKs:

#### **ssi-credentials** - W3C Verifiable Credentials
- **Purpose**: Core VC processing, verification, and format handling
- **Key Components**: CredentialProcessor, Format handlers (JWT, JSON-LD)
- **Role**: Heart of all credential operations across all SDKs
- **Standards**: W3C VC 2.0, JSON-LD 1.1, JWT proofs

#### **ssi-crypto** - Cryptographic Operations
- **Purpose**: Signature algorithms, key management, cryptographic utilities  
- **Key Components**: Ed25519, Secp256k1, Key derivation, Hashing
- **Role**: Provides all cryptographic primitives for the entire ecosystem
- **Integration**: Used by wallets for signing, DIDs for key operations

#### **ssi-storage** - Secure Storage Abstractions
- **Purpose**: Encrypted storage interfaces and implementations
- **Key Components**: InMemoryStorage, SecureWalletStorage, Session storage
- **Role**: Secure persistence layer for wallets and issuers
- **Features**: AES encryption, key vault integration, mobile storage

### Utility Packages (Supporting Layer)

Specialized functionality and shared utilities:

#### **ssi-types** - Shared TypeScript Definitions
- **Purpose**: Common interfaces and types across all packages
- **Role**: Ensures type consistency across the entire ecosystem
- **Usage**: Imported by all other packages for type safety

#### **ssi-utils** - Common Utilities
- **Purpose**: Shared utility functions and helpers
- **Components**: Base64URL encoding, UUID generation, validation helpers
- **Role**: Reduces code duplication across packages

#### **ssi-schema** - JSON-LD Schema Management
- **Purpose**: Credential schema validation and JSON-LD context management
- **Integration**: Used by ssi-credentials for schema validation
- **Standards**: JSON Schema, JSON-LD contexts

#### **ssi-revocation** - Credential Lifecycle
- **Purpose**: Credential revocation, status management, revocation lists
- **Integration**: Used by issuer SDK for credential status updates
- **Standards**: W3C VC Status List, revocation mechanisms

## Package Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE SDKs (What Users Install)          │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Issuer SDK     │   Wallet SDK    │    Verifier SDK         │
│                 │                 │                         │
│ • Issuance      │ • HD Wallets    │ • Verification          │
│ • OpenID4VCI    │ • Key Mgmt      │ • OpenID4VP             │
│ • Sessions      │ • Credentials   │ • Presentations         │
└─────────┬───────┴─────────┬───────┴─────────┬───────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  DID INFRASTRUCTURE                        │
├─────────────────┬─────────────────┬─────────────────────────┤
│   ssi-did       │  ssi-did-key    │   ssi-did-web           │
│                 │                 │                         │
│ • DID Core 1.0  │ • Crypto DIDs   │ • Web DIDs              │  
│ • Resolution    │ • Key Method    │ • HTTPS Resolution      │
│ • Orchestration │ • Self-Sovereign│ • Domain-based          │
└─────────┬───────┴─────────┬───────┴─────────┬───────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   CORE LIBRARIES                           │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│ssi-         │ ssi-crypto  │ ssi-storage │ ssi-credentials   │
│credentials  │             │             │                   │
│             │ • Ed25519   │ • Encryption│ • W3C VC 2.0      │
│• W3C VC     │ • Secp256k1 │ • Key Vault │ • JSON-LD         │
│• Processors │ • Hashing   │ • Sessions  │ • JWT Proofs      │
└─────────┬───┴─────────┬───┴─────────┬───┴─────────┬─────────┘
          │             │             │             │
          └─────────────┼─────────────┼─────────────┘
                        │             │
┌─────────────────────────────────────────────────────────────┐
│                  UTILITY PACKAGES                          │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│ ssi-types   │ ssi-utils   │ ssi-schema  │ ssi-revocation    │
│             │             │             │                   │
│• Interfaces │• Utilities  │• Validation │• Status Lists     │
│• Types      │• Encoding   │• JSON-LD    │• Revocation       │
│• Contracts  │• Helpers    │• Schemas    │• Lifecycle        │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

## Architecture Patterns

### Layered Architecture Pattern
The SSI ecosystem follows a clean layered architecture where each layer has distinct responsibilities:

**Application Layer** (Core SDKs)
- Handle business logic and user-facing operations
- Orchestrate lower layer components
- Provide simplified APIs for common use cases

**Domain Layer** (DID Infrastructure) 
- Manage identity operations and resolution
- Handle DID method-specific implementations  
- Provide universal DID operations

**Infrastructure Layer** (Core Libraries)
- Handle low-level operations (crypto, storage, credentials)
- Implement W3C and IETF standards
- Provide foundational services

**Utility Layer** (Supporting Packages)
- Cross-cutting concerns (types, validation, utilities)
- Shared functionality across all layers
- Development and maintenance support

### Dependency Injection Pattern
SDKs use dependency injection for flexibility and testability:

- **Issuer SDK**: Injects credential processors, DID resolvers, storage adapters
- **Wallet SDK**: Injects storage implementations, crypto providers
- **Verifier SDK**: Injects verification engines, resolution services

### Builder Pattern Implementation
Complex object creation is simplified through builders:

- **Credential Offers**: `OfferBuilder` simplifies OpenID4VCI offer creation
- **Verification Requests**: `AuthorizationRequestBuilder` handles presentation definitions
- **DID Documents**: `DIDDocumentBuilder` manages complex DID document assembly

### Repository Pattern
Data access is abstracted through repository interfaces:

- **Credential Repository**: Manages credential storage and retrieval
- **DID Repository**: Handles DID document persistence
- **Session Repository**: Manages OpenID4VCI session state

## Choosing the Right Package

### For Application Developers
- **Building an Issuer?** → `npm install @blockialabs/ssi-issuer-sdk`
- **Building a Wallet?** → `npm install @blockialabs/ssi-wallet-sdk`  
- **Building a Verifier?** → `npm install @blockialabs/ssi-verifier-sdk`

### For Library Developers
- **Need DID operations only?** → `npm install @blockialabs/ssi-did @blockialabs/ssi-did-key`
- **Need credential processing only?** → `npm install @blockialabs/ssi-credentials`
- **Need cryptography only?** → `npm install @blockialabs/ssi-crypto`

### Architecture Benefits

1. **Modular Design**: Use only what you need
2. **Type Safety**: ssi-types ensures consistency across packages
3. **Standards Compliance**: Each package implements specific W3C/IETF standards
4. **Dependency Management**: Core SDKs handle complex dependency graphs
5. **Maintainability**: Clear separation of concerns and responsibilities