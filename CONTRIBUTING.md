# Contributing to SSI Toolkit

Thank you for your interest in contributing to the professional TypeScript toolkit for Self-Sovereign Identity! We welcome contributions to our core SDKs and supporting libraries. This guide will help you get started and ensure your contributions align with our standards.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Understanding of TypeScript and SSI concepts
- Familiarity with W3C Verifiable Credentials and DID standards

### Development Setup

```bash
# Clone and setup
git clone https://github.com/Blockia-Labs/blockialabs-ssi.git
cd blockialabs-ssi
npm install

# Build all packages
npx nx run-many -t build

# Run tests
npx nx run-many -t test

# Lint code
npx nx run-many -t lint
```

## How to Contribute

1. **Fork the repository** and create your branch from `main`
2. **Choose your focus area**:
   - **Issuer SDK**: OpenID4VCI compliance, credential issuance flows
   - **Wallet SDK**: HD key management, secure storage, BIP32/BIP39
   - **Verifier SDK**: OpenID4VP compliance, presentation verification
   - **DID Core SDK**: DID methods, W3C DID Core compliance
3. **Make your changes** in the appropriate package under `packages/`
4. **Write comprehensive tests** and ensure all existing tests pass
5. **Update documentation** including code comments and README files
6. **Submit a pull request** with detailed description of changes

## Standards & Guidelines

### Code Quality
- **TypeScript First**: All code must be fully typed with proper interfaces
- **Standards Compliance**: Ensure W3C VC/DID and OpenID4VCI/VP compliance  
- **Security First**: Follow cryptographic best practices
- **Performance**: Optimize for production use cases
- **Testing**: Comprehensive unit and integration tests required

### Commit Convention
Use conventional commits with package scope:
```
feat(issuer-sdk): add deferred credential issuance
fix(wallet-sdk): resolve HD key derivation issue  
docs(verifier-sdk): update OpenID4VP examples
test(did-core): add DID resolution test cases
```

### Code Style
- Follow existing ESLint and Prettier configurations
- Use descriptive variable and function names
- Add comprehensive JSDoc comments for public APIs
- Maintain consistent error handling patterns

## What We're Looking For

### High Priority Areas
- **OpenID4VCI Draft-17** compliance improvements
- **OpenID4VP Draft-24** implementation enhancements  
- **W3C DID Core 1.0** method implementations
- **Security hardening** and audit improvements
- **Performance optimizations** for production use
- **Documentation** and example improvements

### New Contributions
- Additional DID method implementations
- Support for new credential formats
- Mobile/React Native optimizations
- Browser extension utilities
- Enterprise integration patterns

## Reporting Issues

- **Security Issues**: Report privately via contact@blockialabs.com
- **Bugs & Features**: Use GitHub Issues with appropriate labels
- **Questions**: Use GitHub Issues for community support

## Review Process

1. All PRs require review from core maintainers
2. Changes affecting standards compliance need extra scrutiny
3. Security-related changes require security team review
4. Documentation changes are highly encouraged

## License

By contributing, you agree that your contributions will be licensed under the [Apache License, Version 2.0](LICENSE).

---

**Thank you for helping build the future of Self-Sovereign Identity!**

For major architectural changes, please open an issue first to discuss the approach with the core team.
