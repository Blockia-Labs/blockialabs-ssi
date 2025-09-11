# SSI Wallet SDK

A comprehensive SDK for managing decentralized identity wallets, providing secure storage, credential management, DID operations, and cryptographic functions for SSI applications.

## Installation

```bash
npm install @blockialabs/ssi-wallet-sdk
```

## Quick Start

```typescript
import { WalletManager, SecureWalletStorage, InMemoryStorage } from '@blockialabs/ssi-wallet-sdk';

// Initialize storage and wallet manager
const storage = new InMemoryStorage();
const secureStorage = new SecureWalletStorage(storage);
const walletManager = new WalletManager(secureStorage);

// Create a new wallet
const wallet = await walletManager.createWallet('your-secure-passcode');

// Use the wallet for SSI operations
const didKey = wallet.getDidKey();
const signature = await wallet.signMessage('Hello, SSI!');
const keyProof = await wallet.createKeyProof('https://issuer.example.com', 'nonce-123');
```

## Core Concepts

### Wallet Management

The `WalletManager` handles wallet lifecycle operations:

```typescript
// Create a new wallet
const wallet = await walletManager.createWallet('passcode123');

// Import existing wallet from mnemonic
const wallet = await walletManager.importWallet(mnemonic, 'passcode123');

// Load existing wallet
const wallet = await walletManager.loadWallet('passcode123');

// Export mnemonic (requires passcode)
const mnemonic = await walletManager.exportMnemonic('passcode123');
```

### Wallet Operations

The `Wallet` class provides cryptographic operations:

```typescript
// Sign messages for VC/VP operations
const signature = await wallet.signMessage('message to sign');

// Verify signatures
const isValid = await wallet.verifyMessage('message', signature);

// Generate DID:key identifier
const didKey = wallet.getDidKey();

// Get public key as JWK
const jwk = wallet.getPublicKeyJWK();

// Create key proof for credential issuance (OpenID4VCI)
const keyProof = await wallet.createKeyProof('audience', 'nonce');
```

### Multi-Account Wallets

Derive multiple accounts from a single seed:

```typescript
// Derive multiple accounts
const accounts = await walletManager.deriveMultipleAccounts('passcode123', 3);

// Each account is a separate wallet instance
accounts.forEach((account, index) => {
  console.log(`Account ${index}: ${account.getDidKey()}`);
});
```

### Activity Tracking

Track wallet activities:

```typescript
import { ActivityManager, ActivityRepository } from '@blockialabs/ssi-wallet-sdk';

const activityRepo = new ActivityRepository(storage);
const activityManager = new ActivityManager(activityRepo);

// Log activities
await activityManager.createActivity({
  // ...options
});

// Query activities
const activities = await activityManager.getRecentActivities();
```

## Configuration

Customize wallet behavior with configuration options:

```typescript
const walletManager = new WalletManager(secureStorage, {
  derivationPath: "m/44'/60'/0'/0", // Custom derivation path
  entropySize: 256, // 24-word mnemonic
});
```

## Building

Run `nx build ssi-wallet-sdk` to build the library.

## Running unit tests

Run `nx test ssi-wallet-sdk` to execute the unit tests via [Jest](https://jestjs.io).

## Running lint

Run `nx lint ssi-wallet-sdk` to check if there are lint errors.

See [LICENSE](../../LICENSE).
