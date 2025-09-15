# Wallet SDK

Professional SSI wallet with HD key derivation, secure storage, and DID management.

```bash
npm install @blockialabs/ssi-wallet-sdk
```

## Building Blocks Overview

The `WalletManager` is built from these components:

```
WalletManager
├── SecureWalletStorage (encrypted mnemonic storage)
│   └── Storage Backend (in-memory, file system, database)
└── Wallet Instance (HD key derivation, DID management)
    ├── Mnemonic (BIP39 seed phrase)
    ├── HD Keys (BIP32 key derivation)
    ├── DID Generation (from public keys)
    └── Cryptographic Operations (signing, proofs)
```

Let's build each component step by step:

## Step 1: Storage Backend

**What it does:** Provides the underlying storage for encrypted wallet data.

```typescript
import { InMemoryStorage } from '@blockialabs/ssi-wallet-sdk';

const storageBackend = new InMemoryStorage();
```

**Why you need it:** The wallet needs somewhere to securely store the encrypted mnemonic phrase.

**Options:**
- `InMemoryStorage` - For development/testing
- `FileStorage` - For desktop applications  
- `DatabaseStorage` - For server applications

## Step 2: Secure Storage Layer

**What it does:** Encrypts/decrypts the mnemonic phrase using the user's passcode.

```typescript
import { SecureWalletStorage } from '@blockialabs/ssi-wallet-sdk';

const secureStorage = new SecureWalletStorage(storageBackend);
```

**Why you need it:** Raw mnemonic phrases must never be stored unencrypted. This layer uses PBKDF2 + AES encryption.

## Step 3: Wallet Manager

**What it does:** Manages wallet lifecycle (create, load, import, export).

```typescript
import { WalletManager } from '@blockialabs/ssi-wallet-sdk';

const walletManager = new WalletManager(secureStorage);
```

**Why you need it:** Provides high-level wallet operations while handling the complex cryptography internally.

## Step 4: Create Wallet

**What happens:** Generates BIP39 mnemonic → Derives HD keys → Creates DID → Encrypts and stores.

```typescript
const wallet = await walletManager.createWallet('secure-password');
console.log('Your DID:', wallet.getDidKey());
```

**Behind the scenes:**
1. Generates 24-word BIP39 mnemonic
2. Derives master key using BIP32
3. Creates secp256k1 key pair for account 0
4. Generates DID:key from public key
5. Encrypts mnemonic with user passcode
6. Stores encrypted data securely

## Step 5: Use Wallet Operations

**What you can do:** Sign messages, create proofs, manage credentials.

```typescript
// Cryptographic message signing
const signature = await wallet.signMessage('Hello SSI World');

// Create JWT proof for verifiers
const keyProof = await wallet.createKeyProof(
  'https://verifier.com',  // audience
  'challenge-nonce'        // nonce from verifier
);

// Get wallet information
console.log('DID:', wallet.getDidKey());
console.log('Public Key:', wallet.publicKeyHex);
console.log('Account Index:', wallet.accountIndex);
```

**Why this matters:** These operations prove ownership of the DID without revealing private keys.

---

## Advanced Operations

### Load Existing Wallet

```typescript
// Load wallet that was previously created
const existingWallet = await walletManager.loadWallet('secure-password');

// Verify signature
const isValid = await existingWallet.verifyMessage('Hello World', signature);
console.log('Signature valid:', isValid);
```

### Multi-Account Support

```typescript
// Generate multiple accounts from same seed
const accounts = await walletManager.deriveMultipleAccounts('secure-password', 3);

accounts.forEach((account, index) => {
  console.log(`Account ${index}:`, account.getDidKey());
});
```

### Backup & Recovery

```typescript
// Export mnemonic for backup
const mnemonic = await walletManager.exportMnemonic('secure-password');

// Import wallet from mnemonic
const importedWallet = await walletManager.importWallet(mnemonic, 'new-password');
```

### Credential Management

```typescript
import { CredentialManager } from '@blockialabs/ssi-wallet-sdk';

const credentialManager = new CredentialManager(repository);

// Store received credential
await credentialManager.store({
  id: 'credential_123',
  type: ['VerifiableCredential', 'IdentityCredential'],
  credentialSubject: { id: wallet.getDidKey(), name: 'Alice' }
});

// Query credentials
const credentials = await credentialManager.findByType('IdentityCredential');
```