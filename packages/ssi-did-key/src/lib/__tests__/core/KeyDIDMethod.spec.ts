import { base58 } from '@scure/base';
import { KeyDIDMethod } from '../../core/KeyDIDMethod.js';
import { randomBytes } from 'crypto';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { VerificationMethodType, ProofPurpose } from '@blockialabs/ssi-did';

describe('KeyDIDMethod', () => {
  let keyDIDMethod: KeyDIDMethod;
  let mockPublicKeyHex: string;

  beforeEach(() => {
    keyDIDMethod = new KeyDIDMethod();
    const privateKey = randomBytes(32);
    const publicKey = secp256k1.getPublicKey(privateKey, true);
    mockPublicKeyHex = Buffer.from(publicKey).toString('hex');
  });

  describe('create', () => {
    it('should create a valid DID document', async () => {
      const result = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });

      expect(result.did).toBeDefined();
      expect(result.did).toMatch(/^did:key:[1-9A-HJ-NP-Za-km-z]+$/);
      expect(result.didDocument).toBeDefined();
      expect(result.didDocument.id).toBe(result.did);
      expect(result.didDocument['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(result.didDocument.controller).toBe(result.did);

      expect(result.didDocument.verificationMethod).toHaveLength(1);
      expect(result.didDocument.verificationMethod?.[0]?.type).toBe(
        VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
      );
      expect(result.didDocument.verificationMethod?.[0]?.controller).toBe(result.did);

      expect(result.didDocument.authentication).toHaveLength(1);
      expect(result.didDocument.authentication?.[0]).toBe(`${result.did}#controllerKey`);

      expect(result.didDocument.assertionMethod).toHaveLength(1);
      expect(result.didDocument.assertionMethod?.[0]).toBe(`${result.did}#controllerKey`);

      // Check key agreement - NEEDS BETTER HANDLING in KeyDIDMethod.ts
      // expect(result.didDocument.keyAgreement).toHaveLength(1);
      // if (typeof result.didDocument.keyAgreement?.[0] !== 'string') {
      //   expect(result.didDocument.keyAgreement?.[0].type).toBe(
      //     VerificationMethodType.X25519KeyAgreementKey2019,
      //   );
      // }
    });

    it('should throw an error if publicKeyHex is missing', async () => {
      await expect(keyDIDMethod.create({} as never)).rejects.toThrow('publicKeyHex is required');
    });

    it('should include proof if signature is provided', async () => {
      const mockSignature = 'mockSignature123';
      const mockKeyId = 'mockKeyId123';
      const result = await keyDIDMethod.create({
        publicKeyHex: mockPublicKeyHex,
        signature: mockSignature,
        keyId: mockKeyId,
        signatureType: 'EcdsaSecp256k1Signature2019',
      });

      expect(result.didDocument.proof).toBeDefined();
      if (Array.isArray(result.didDocument.proof)) {
        expect(result.didDocument.proof[0]?.id).toBe(mockKeyId);
        expect(result.didDocument.proof[0]?.type).toBe('EcdsaSecp256k1Signature2019');
        expect(result.didDocument.proof[0]?.proofPurpose).toBe(ProofPurpose.Authentication);
        expect(result.didDocument.proof[0]?.proofValue).toBe(mockSignature);
      } else {
        expect(result.didDocument.proof?.id).toBe(mockKeyId);
        expect(result.didDocument.proof?.type).toBe('EcdsaSecp256k1Signature2019');
        expect(result.didDocument.proof?.proofPurpose).toBe(ProofPurpose.Authentication);
        expect(result.didDocument.proof?.proofValue).toBe(mockSignature);
      }
    });
  });

  describe('resolve', () => {
    it('should resolve a valid did:key DID', async () => {
      const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
      const result = await keyDIDMethod.resolve(did);

      expect(result.didDocument).toBeDefined();
      expect(result.didDocument?.id).toBe(did);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.deactivated).toBe(false);
    });

    it('should throw an error for invalid DID format', async () => {
      await expect(keyDIDMethod.resolve('invalid:did')).rejects.toThrow('Invalid did:key format');
    });

    it('should throw an error for invalid Base58 method-specific-id', async () => {
      await expect(keyDIDMethod.resolve('did:key:$invalid')).rejects.toThrow(
        'Invalid method-specific-id',
      );
    });
    // Needs better handling in.KeyDIDMethod.ts
    // it('should generate X25519 key for key agreement', async () => {
    //   const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
    //   const result = await keyDIDMethod.resolve(did);

    //   expect(result.didDocument?.keyAgreement).toHaveLength(1);
    //   if (typeof result.didDocument?.keyAgreement?.[0] !== 'string') {
    //     expect(result.didDocument?.keyAgreement?.[0].type).toBe(
    //       VerificationMethodType.X25519KeyAgreementKey2019,
    //     );
    //   }
    // });
  });

  describe('update', () => {
    it('should update an existing DID document', async () => {
      const { did, didDocument } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });

      const updatedDocument = {
        ...didDocument,
        service: [
          {
            id: `${did}#testService`,
            type: 'TestService',
            serviceEndpoint: 'https://test.service.com',
          },
        ],
      };

      const result = await keyDIDMethod.update(did, updatedDocument, {
        publicKeyHex: mockPublicKeyHex,
        signature: 'mockSignature',
        keyId: 'mockKeyId',
      });

      expect(result.id).toBe(did);
      expect(result.service).toBeDefined();
      expect(result.service?.[0].id).toBe(`${did}#testService`);
      expect(result.service?.[0].type).toBe('TestService');
      expect(result.service?.[0].serviceEndpoint).toBe('https://test.service.com');
    });

    it('should throw an error if DID does not match document ID', async () => {
      const { didDocument } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });

      await expect(
        keyDIDMethod.update('did:key:mismatch', didDocument, {
          publicKeyHex: mockPublicKeyHex,
        }),
      ).rejects.toThrow('DID Document id does not match');
    });

    it('should add a proof when signature is provided', async () => {
      const { did, didDocument } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });

      const result = await keyDIDMethod.update(did, didDocument, {
        publicKeyHex: mockPublicKeyHex,
        signature: 'updateSignature',
        keyId: 'updateKeyId',
      });

      expect(result.proof).toBeDefined();
      if (Array.isArray(result.proof)) {
        expect(result.proof[0].id).toBe('updateKeyId');
        expect(result.proof[0].proofValue).toBe('updateSignature');
      } else {
        expect(result.proof?.id).toBe('updateKeyId');
        expect(result.proof?.proofValue).toBe('updateSignature');
      }
    });
  });

  describe('deactivate', () => {
    it('should deactivate a DID', async () => {
      const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
      const result = await keyDIDMethod.deactivate(did, {
        publicKeyHex: mockPublicKeyHex,
      });

      expect(result.metadata.deactivated).toBe(true);
      expect(result.didDocument).toBeDefined();
    });

    it('should add a deactivation proof when signature is provided', async () => {
      const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });

      const result = await keyDIDMethod.deactivate(did, {
        publicKeyHex: mockPublicKeyHex,
        signature: 'deactivateSignature',
        keyId: 'deactivateKeyId',
      });

      expect(result.didDocument?.proof).toBeDefined();
      if (!Array.isArray(result.didDocument?.proof)) {
        expect(result.didDocument?.proof?.id).toBe('deactivateKeyId');
        expect(result.didDocument?.proof?.proofValue).toBe('deactivateSignature');
      }
    });
  });

  describe('Integration tests', () => {
    it('should create, resolve, update, and deactivate a DID', async () => {
      const { did, didDocument } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
      expect(did).toMatch(/^did:key:/);

      const resolveResult = await keyDIDMethod.resolve(did);
      expect(resolveResult.didDocument?.id).toBe(did);
      expect(resolveResult.metadata.deactivated).toBe(false);

      const updatedDocument = {
        ...didDocument,
        service: [
          {
            id: `${did}#testService`,
            type: 'TestService',
            serviceEndpoint: 'https://test.service.com',
          },
        ],
      };

      const updateResult = await keyDIDMethod.update(did, updatedDocument, {
        publicKeyHex: mockPublicKeyHex,
        signature: 'updateSignature',
      });
      expect(updateResult.service?.[0].type).toBe('TestService');

      const deactivateResult = await keyDIDMethod.deactivate(did, {
        publicKeyHex: mockPublicKeyHex,
        signature: 'deactivateSignature',
      });
      expect(deactivateResult.metadata.deactivated).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle Base58 encoding/decoding correctly', async () => {
      const knownPublicKey = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
      const { did } = await keyDIDMethod.create({ publicKeyHex: knownPublicKey });

      const base58Part = did.split(':')[2];

      const decoded = base58.decode(base58Part);
      expect(Buffer.from(decoded).toString('hex')).toBe(knownPublicKey);
    });
  });
});
