# Blockialabs SSI Monorepo

Welcome to the Blockialabs SSI Monorepo! This repository contains open-source libraries and SDKs for Self-Sovereign Identity (SSI) solutions, including credential issuance, verification, DID management, and more.

## Packages

All libraries are located in the `packages/` directory. Each package is independently versioned and can be published to NPM.

- **ssi-credentials**: Credential issuance and management
- **ssi-crypto**: Cryptographic utilities for SSI
- **ssi-did**: DID (Decentralized Identifier) management
- **ssi-did-key**: DID Key support
- **ssi-did-web**: DID Web support
- **ssi-revocation**: Credential revocation
- **ssi-schema**: Credential schemas
- **ssi-storage**: Storage solutions for SSI
- **ssi-types**: Shared types
- **ssi-utils**: Utility functions
- **ssi-issuer-sdk**: SDK for credential issuers
- **ssi-verifier-sdk**: SDK for verifiers
- **ssi-wallet-sdk**: SDK for wallets

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/Blockia-Labs/blockialabs-ssi.git
   cd blockialabs-ssi
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build all packages:
   ```bash
   npx nx run-many -t build
   ```
4. Run lint:
   ```bash
   npx nx run-many -t lint
   ```
5. Run tests:
   ```bash
   npx nx run-many -t test
   ```

## Publishing

This monorepo uses [Nx Release](https://nx.dev/features/manage-releases) for managing package releases and publishing to NPM.

For detailed instructions on how to configure and use Nx Release, please refer to the official documentation:

- [Nx Release Documentation](https://nx.dev/features/manage-releases)
- [Release NPM Packages Recipe](https://nx.dev/recipes/nx-release/release-npm-packages)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](./LICENSE).
