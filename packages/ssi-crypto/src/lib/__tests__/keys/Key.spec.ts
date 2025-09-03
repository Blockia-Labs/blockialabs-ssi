import { KeyType } from '@blockialabs/ssi-types';
import { Key } from '../../keys/Key.js';

describe('Key', () => {
  const mockPublicKey = new Uint8Array([1, 2, 3]);
  const mockPrivateKey = new Uint8Array([4, 5, 6]);
  const keyType: KeyType = 'Ed25519';

  describe('constructor', () => {
    it('should create a key with public and private components', () => {
      const key = new Key(mockPublicKey, mockPrivateKey, keyType);
      expect(key.publicKey).toEqual(mockPublicKey);
      expect(key.privateKey).toEqual(mockPrivateKey);
      expect(key.type).toBe(keyType);
    });
  });

  describe('toJWK', () => {
    it('should convert Ed25519 key to JWK format', () => {
      const key = new Key(mockPublicKey, mockPrivateKey, 'Ed25519');
      const jwk = key.toJWK();

      expect(jwk.kty).toBe('OKP');
      expect(jwk.crv).toBe('Ed25519');
      expect(jwk.x).toBeDefined();
      expect(jwk.d).toBeDefined();
    });

    it('should convert Secp256k1 key to JWK format', () => {
      const key = new Key(mockPublicKey, mockPrivateKey, 'Secp256k1');
      const jwk = key.toJWK();

      expect(jwk.kty).toBe('EC');
      expect(jwk.crv).toBe('secp256k1');
      expect(jwk.x).toBeDefined();
      expect(jwk.y).toBeDefined();
      expect(jwk.d).toBeDefined();
    });
  });
});
