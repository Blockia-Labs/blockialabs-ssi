# SSI Toolkit
## Professional TypeScript SDK for Self-Sovereign Identity

[![CI](https://github.com/Blockia-Labs/blockialabs-ssi/actions/workflows/ci.yml/badge.svg)](https://github.com/Blockia-Labs/blockialabs-ssi/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm](https://img.shields.io/npm/v/@blockialabs/ssi-issuer-sdk)](https://www.npmjs.com/package/@blockialabs/ssi-issuer-sdk)

**The complete TypeScript toolkit for building Self-Sovereign Identity applications.** Four focused SDKs covering the entire SSI ecosystem: credential issuance (OpenID4VCI Draft-17), wallet management (BIP32/BIP39), credential verification (OpenID4VP Draft-24), and DID operations (W3C DID Core 1.0).

**[Documentation](./docs/)** | **[SDK Guides](./docs/docs/intro.md)** | **[Issues](https://github.com/Blockia-Labs/blockialabs-ssi/issues)**

---

## Why SSI Toolkit?

**Self-Sovereign Identity** enables individuals and organizations to own and control their digital credentials without relying on centralized authorities. Think digital diplomas, licenses, certifications that are:
- **Cryptographically verifiable** without calling the issuer
- **Privacy-preserving** with selective disclosure
- **Decentralized** with no single point of failure

## Features

- **Complete SSI Coverage**: Four specialized SDKs for the entire SSI ecosystem
- **Standards Compliant**: OpenID4VCI Draft-17, OpenID4VP Draft-24, W3C VC 2.0, DID Core 1.0  
- **TypeScript First**: Complete type safety with IntelliSense support
- **Enterprise Security**: HD wallets, secure storage, cryptographic proofs
- **Production Ready**: Professional architecture, comprehensive testing
- **Modular Design**: Use individual packages or complete SDK solutions

## Quick Start

### Choose Your SDK

```bash
# Issue credentials (universities, employers, government)
npm install @blockialabs/ssi-issuer-sdk

# Build wallets (mobile apps, browser extensions)
npm install @blockialabs/ssi-wallet-sdk

# Verify credentials (employers, service providers)
npm install @blockialabs/ssi-verifier-sdk

# Work with DIDs directly (all applications)
npm install @blockialabs/ssi-did @blockialabs/ssi-did-key
```

### Get Started in 3 Steps

```bash
# 1. Install the SDK you need
npm install @blockialabs/ssi-issuer-sdk

# 2. Follow the step-by-step guide  
open ./docs/docs/sdks/issuer-sdk.md

# 3. Build your SSI application!
```

**→ [View Complete Documentation](./docs/)** with working examples, API references, and implementation guides.

## Architecture

### Four Focused SDKs

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Issuer SDK    │  │   Wallet SDK    │  │  Verifier SDK   │  │  DID Core SDK   │
│                 │  │                 │  │                 │  │                 │
│ • OpenID4VCI    │  │ • HD Wallets    │  │ • OpenID4VP     │  │ • DID Methods   │
│ • Draft-17      │  │ • BIP32/BIP39   │  │ • Draft-24      │  │   (key, web)    │
│ • Session Mgmt  │  │ • Secure Storage│  │ • Presentation  │  │ • Resolution    │
│ • Deferred Flow │  │ • DID Operations│  │   Definitions   │  │ • W3C DID Core  │
│ • Builder APIs  │  │ • Crypto Proofs │  │ • Token Exchange│  │ • Universal Ops │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Standards Compliance

**W3C Standards:**
- ✅ **Verifiable Credentials 2.0** - Complete credential lifecycle
- ✅ **DID Core 1.0** - Universal identifier resolution  
- ✅ **JSON-LD 1.1** - Linked data processing

**OpenID Standards:**
- ✅ **OpenID4VCI Draft-17** - Credential issuance flows
- ✅ **OpenID4VP Draft-24** - Presentation verification

**Cryptographic Standards:**
- ✅ **BIP32/BIP39** - HD wallet key derivation
- ✅ **JWT/JWS** - Cryptographic proof formats
- ✅ **Ed25519/Secp256k1** - Digital signature algorithms

## Package Structure

This monorepo contains the following packages:

### Core SDKs (What developers use)
- **[@blockialabs/ssi-issuer-sdk](./packages/ssi-issuer-sdk)**: Issue credentials with OpenID4VCI Draft-17
- **[@blockialabs/ssi-wallet-sdk](./packages/ssi-wallet-sdk)**: HD wallets with secure storage and DID management  
- **[@blockialabs/ssi-verifier-sdk](./packages/ssi-verifier-sdk)**: Verify credentials with OpenID4VP Draft-24
- **[@blockialabs/ssi-did](./packages/ssi-did)**: Universal DID operations and method management

### Foundation Libraries (Auto-installed dependencies)
- **[@blockialabs/ssi-credentials](./packages/ssi-credentials)**: W3C Verifiable Credentials processing
- **[@blockialabs/ssi-did-key](./packages/ssi-did-key)**: DID:key method implementation
- **[@blockialabs/ssi-did-web](./packages/ssi-did-web)**: DID:web method implementation  
- **[@blockialabs/ssi-storage](./packages/ssi-storage)**: Secure storage abstractions
- **[@blockialabs/ssi-types](./packages/ssi-types)**: Shared TypeScript definitions

### Utility Packages
- **[@blockialabs/ssi-revocation](./packages/ssi-revocation)**: Credential revocation management
- **[@blockialabs/ssi-utils](./packages/ssi-utils)**: Common cryptographic and utility functions

## Development

### Setup

```bash
git clone https://github.com/Blockia-Labs/blockialabs-ssi.git
cd blockialabs-ssi
npm ci --legacy-peer-deps
```

### Build & Test

```bash
# Run the full CI pipeline (same as GitHub Actions)
npx nx run-many -t lint test build typecheck

# Or run individual tasks
npx nx run-many -t build        # Build all packages
npx nx run-many -t test         # Run tests
npx nx run-many -t lint         # Lint code
npx nx run-many -t typecheck    # TypeScript checking
```

## Documentation

Complete guides and examples are available in our documentation:

- **[Issuer SDK](./docs/docs/sdks/issuer-sdk.md)**: Complete credential issuance flows
- **[Wallet SDK](./docs/docs/sdks/wallet-sdk.md)**: HD wallet implementation 
- **[Verifier SDK](./docs/docs/sdks/verifier-sdk.md)**: Credential verification flows
- **[DID Core SDK](./docs/docs/sdks/did-core.md)**: DID operations and resolution

Each SDK guide includes working code examples with real method signatures and proper error handling.

## Publishing

This monorepo uses [Nx Release](https://nx.dev/features/manage-releases) for managing package releases and publishing to NPM.

For detailed instructions on how to configure and use Nx Release, please refer to the official documentation:

- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [Release NPM Packages Recipe](https://nx.dev/recipes/nx-release/release-npm-packages)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](./LICENSE).
