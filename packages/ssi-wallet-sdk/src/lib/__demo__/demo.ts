// Todo: Keep this package clean from demo code
// Move this demo to a separate package or folder e.g. scripts

import { Wallet } from '../core/wallet/Wallet.js';
import { WalletManager } from '../core/wallet/WalletManager.js';
import { SecureWalletStorage } from '../core/wallet/SecureWalletStorage.js';
import { InMemoryStorage } from '../core/shared/InMemoryStorage.js';

async function main() {
  console.log('=== SSI Wallet SDK Demo ===\n');

  // 1. Initialize the Wallet Manager
  const memoryStorage = new InMemoryStorage();
  const secureStorage = new SecureWalletStorage(memoryStorage);
  const walletManager = new WalletManager(secureStorage);

  console.log('✅ Wallet Manager initialized');

  // 2. Check if wallet exists
  const walletExists = await walletManager.walletExists();
  console.log(`\nWallet exists? ${walletExists ? 'Yes' : 'No'}`);

  if (!walletExists) {
    // 3. Create a new wallet
    console.log('\nCreating new wallet...');
    const wallet = await walletManager.createWallet('my-strong-password');
    displayWalletInfo(wallet, 'New Wallet');
  }

  // 4. Load the wallet
  console.log('\nLoading wallet...');
  const loadedWallet = await walletManager.loadWallet('my-strong-password');
  displayWalletInfo(loadedWallet, 'Loaded Wallet');

  // 5. Sign and verify message
  console.log('\nTesting message signing...');
  const message = 'Hello, SSI World!';
  const signature = await loadedWallet.signMessage(message);
  console.log(`Message: "${message}"`);
  console.log(`Signature: ${signature.substring(0, 20)}...${signature.slice(-20)}`);

  const isValid = await loadedWallet.verifyMessage(message, signature);
  console.log(`Signature valid? ${isValid ? '✅ Yes' : '❌ No'}`);

  // 6. DID operations
  console.log('\nTesting DID operations...');
  const didKey = loadedWallet.getDidKey();
  console.log(`DID Key: ${didKey}`);

  const jwk = loadedWallet.getPublicKeyJWK();
  console.log(`JWK: ${JSON.stringify(jwk, null, 2)}`);

  // 7. Create key proof for credential issuance
  console.log('\nCreating key proof...');
  const audience = 'https://issuer.example.com';
  const nonce = 'demo-nonce-123';
  const keyProof = await loadedWallet.createKeyProof(audience, nonce);
  console.log(`Key Proof: ${keyProof.substring(0, 50)}...`);

  // 8. Derive multiple accounts
  console.log('\nDeriving multiple accounts...');
  const accounts = await walletManager.deriveMultipleAccounts('my-strong-password', 3);
  accounts.forEach((account, index) => {
    displayWalletInfo(account, `Account #${index}`);
  });

  // 9. Export mnemonic
  console.log('\nExporting mnemonic phrase...');
  const mnemonic = await walletManager.exportMnemonic('my-strong-password');
  console.log(`Mnemonic: "${mnemonic}"`);

  // 10. Change passcode
  console.log('\nChanging passcode...');
  await walletManager.changePasscode('my-strong-password', 'new-stronger-password');
  console.log('✅ Passcode changed successfully');

  // 11. Try loading with old passcode (should fail)
  try {
    console.log('\nTrying to load with old passcode...');
    await walletManager.loadWallet('my-strong-password');
  } catch (error) {
    console.log('❌ Expected error:', error instanceof Error ? error.message : 'old passcode');
  }

  // 12. Load with new passcode
  console.log('\nLoading with new passcode...');
  const walletWithNewPass = await walletManager.loadWallet('new-stronger-password');
  console.log('✅ Successfully loaded with new passcode');
  console.log(`Wallet Key ID: ${walletWithNewPass.keyId}`);

  // 13. Delete wallet
  console.log('\nDeleting wallet...');
  await walletManager.deleteWallet();
  console.log('✅ Wallet deleted');

  // Final check
  const finalExists = await walletManager.walletExists();
  console.log(`\nWallet exists now? ${finalExists ? 'Yes' : 'No'}`);
}

function displayWalletInfo(wallet: Wallet, title: string) {
  console.log(`\n${title}:`);
  console.log('--------------------------------');
  console.log(`Key ID:     ${wallet.keyId}`);
  console.log(
    `Public Key: ${wallet.publicKeyHex.substring(0, 20)}...${wallet.publicKeyHex.slice(-20)}`,
  );
  console.log(`DID Key:    ${wallet.getDidKey()}`);
  console.log(`Account #:  ${wallet.accountIndex}`);
  console.log('--------------------------------');
}

// Run the demo
main().catch(console.error);
