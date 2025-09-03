import { Wallet } from '../core/wallet/Wallet.js';
import { ValidationError } from '../utils/errors.js';

describe('Wallet', () => {
  const testMnemonic =
    'legal winner thank year wave sausage worth useful legal winner thank yellow';
  const derivationPath = "m/44'/60'/0'/0";
  const accountIndex = 0;

  describe('fromMnemonic', () => {
    it('should create wallet from valid mnemonic', async () => {
      const wallet = await Wallet.fromMnemonic(testMnemonic, derivationPath, accountIndex);
      expect(wallet).toBeInstanceOf(Wallet);
      expect(wallet.mnemonic).toBe(testMnemonic);
      expect(wallet.privateKeyHex).toMatch(/^[a-f0-9]{64}$/);
      expect(wallet.publicKeyHex).toMatch(/^[a-f0-9]{66}$/);
      expect(wallet.keyId).toMatch(/^[A-Za-z0-9_-]+=*$/);
    });

    it('should throw for invalid mnemonic', async () => {
      await expect(Wallet.fromMnemonic('invalid', derivationPath, accountIndex)).rejects.toThrow(
        ValidationError,
      );
    });

    it('should create different wallets for different account indices', async () => {
      const wallet1 = await Wallet.fromMnemonic(testMnemonic, derivationPath, 0);
      const wallet2 = await Wallet.fromMnemonic(testMnemonic, derivationPath, 1);
      expect(wallet1.privateKeyHex).not.toBe(wallet2.privateKeyHex);
      expect(wallet1.publicKeyHex).not.toBe(wallet2.publicKeyHex);
      expect(wallet1.keyId).not.toBe(wallet2.keyId);
    });
  });

  describe('signing', () => {
    let wallet: Wallet;

    beforeAll(async () => {
      wallet = await Wallet.fromMnemonic(testMnemonic, derivationPath, accountIndex);
    });

    it('should sign message', async () => {
      const message = 'test message';
      const signature = await wallet.signMessage(message);
      expect(signature).toMatch(/^[A-Za-z0-9_-]+=*$/);
    });

    it('should verify valid signature', async () => {
      const message = 'test message';
      const signature = await wallet.signMessage(message);
      const isValid = await wallet.verifyMessage(message, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const message = 'test message';
      const isValid = await wallet.verifyMessage(message, 'invalid_signature');
      expect(isValid).toBe(false);
    });
  });

  describe('DID operations', () => {
    let wallet: Wallet;

    beforeAll(async () => {
      wallet = await Wallet.fromMnemonic(testMnemonic, derivationPath, accountIndex);
    });

    it('should generate DID key', () => {
      const didKey = wallet.getDidKey();
      expect(didKey).toMatch(/^did:key:z[A-Za-z0-9_-]+=*$/);
    });

    it('should generate JWK', () => {
      const jwk = wallet.getPublicKeyJWK();
      expect(jwk.kty).toBe('EC');
      expect(jwk.crv).toBe('secp256k1');
      expect(jwk.x).toMatch(/^[A-Za-z0-9_-]+=*$/);
      expect(jwk.y).toMatch(/^[A-Za-z0-9_-]+=*$/);
    });

    it('should create key proof', async () => {
      const audience = 'https://issuer.example.com';
      const nonce = 'test-nonce';
      const proof = await wallet.createKeyProof(audience, nonce);
      expect(proof).toMatch(/^[A-Za-z0-9_-]+=*\.[A-Za-z0-9_-]+=*\.[A-Za-z0-9_-]+=*$/);
    });
  });
});
