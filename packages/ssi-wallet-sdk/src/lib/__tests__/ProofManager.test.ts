import { ProofParams } from '../types/index.js';
import { ProofManager } from '../core/jwt/ProofManager.js';

describe('ProofManager', () => {
  let proofManager: ProofManager;
  let validParams: ProofParams;

  beforeEach(() => {
    proofManager = new ProofManager();
    validParams = {
      privateKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      holderDid: 'did:example:holder123',
      issuerDid: 'did:example:issuer456',
      nonce: 'test-nonce-12345',
    };
  });

  describe('generateJwtProof', () => {
    describe('successful proof generation', () => {
      it('should generate a valid JWT proof with correct structure', async () => {
        const proof = await proofManager.generateJwtProof(validParams);

        expect(typeof proof).toBe('string');
        expect(proof.split('.')).toHaveLength(3);

        const [headerB64, payloadB64, signatureB64] = proof.split('.');
        expect(headerB64).toBeTruthy();
        expect(payloadB64).toBeTruthy();
        expect(signatureB64).toBeTruthy();
      });

      it('should generate JWT with correct header structure', async () => {
        const proof = await proofManager.generateJwtProof(validParams);
        const [headerB64] = proof.split('.');

        const headerJson = JSON.parse(
          Buffer.from(headerB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
        );

        expect(headerJson).toEqual({
          alg: 'secp256k1',
          typ: 'openid4vci-proof+jwt',
          kid: `${validParams.holderDid}#controllerKey`,
        });
      });

      it('should generate JWT with correct payload structure', async () => {
        const proof = await proofManager.generateJwtProof(validParams);
        const [, payloadB64] = proof.split('.');

        const payloadJson = JSON.parse(
          Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(),
        );

        expect(payloadJson.iss).toBe(validParams.holderDid);
        expect(payloadJson.aud).toBe(validParams.issuerDid);
        expect(payloadJson.nonce).toBe(validParams.nonce);
        expect(typeof payloadJson.iat).toBe('number');
        expect(payloadJson.iat).toBeGreaterThan(0);
      });

      it('should generate different signatures for different private keys', async () => {
        const params1 = { ...validParams };
        const params2 = {
          ...validParams,
          privateKey: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        };

        const proof1 = await proofManager.generateJwtProof(params1);
        const proof2 = await proofManager.generateJwtProof(params2);

        const signature1 = proof1.split('.')[2];
        const signature2 = proof2.split('.')[2];

        expect(signature1).not.toBe(signature2);
      });

      it('should generate different signatures for different nonces', async () => {
        const params1 = { ...validParams };
        const params2 = { ...validParams, nonce: 'different-nonce' };

        const proof1 = await proofManager.generateJwtProof(params1);
        const proof2 = await proofManager.generateJwtProof(params2);

        const signature1 = proof1.split('.')[2];
        const signature2 = proof2.split('.')[2];

        expect(signature1).not.toBe(signature2);
      });

      it('should generate consistent proof for same inputs', async () => {
        // Mock Date.now to ensure consistent timestamp
        const mockTime = 1234567890000;
        jest.spyOn(Date, 'now').mockReturnValue(mockTime);

        const proof1 = await proofManager.generateJwtProof(validParams);
        const proof2 = await proofManager.generateJwtProof(validParams);

        expect(proof1).toBe(proof2);

        jest.restoreAllMocks();
      });
    });

    describe('validation failures', () => {
      describe('privateKey validation', () => {
        it('should throw error for empty privateKey', async () => {
          const params = { ...validParams, privateKey: '' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey is required and must be a non-empty string',
          );
        });

        it('should throw error for undefined privateKey', async () => {
          const params = { ...validParams, privateKey: undefined as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey is required and must be a non-empty string',
          );
        });

        it('should throw error for null privateKey', async () => {
          const params = { ...validParams, privateKey: null as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey is required and must be a non-empty string',
          );
        });

        it('should throw error for whitespace-only privateKey', async () => {
          const params = { ...validParams, privateKey: '   ' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey is required and must be a non-empty string',
          );
        });

        it('should throw error for non-string privateKey', async () => {
          const params = { ...validParams, privateKey: 123 as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey is required and must be a non-empty string',
          );
        });

        it('should throw error for non-hex privateKey', async () => {
          const params = {
            ...validParams,
            privateKey: 'not-hex-string-contains-invalid-characters-xyz123',
          };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey must be a valid hexadecimal string',
          );
        });

        it('should throw error for short privateKey', async () => {
          const params = { ...validParams, privateKey: '1234567890abcdef' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey must be 32 bytes (64 hex characters) for SECP256K1',
          );
        });

        it('should throw error for long privateKey', async () => {
          const params = {
            ...validParams,
            privateKey: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00',
          };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: privateKey must be 32 bytes (64 hex characters) for SECP256K1',
          );
        });

        it('should accept valid lowercase hex privateKey', async () => {
          const params = {
            ...validParams,
            privateKey: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          };

          await expect(proofManager.generateJwtProof(params)).resolves.toBeTruthy();
        });

        it('should accept valid uppercase hex privateKey', async () => {
          const params = {
            ...validParams,
            privateKey: 'ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
          };

          await expect(proofManager.generateJwtProof(params)).resolves.toBeTruthy();
        });

        it('should accept valid mixed case hex privateKey', async () => {
          const params = {
            ...validParams,
            privateKey: 'AbCdEf1234567890aBcDeF1234567890AbCdEf1234567890aBcDeF1234567890',
          };

          await expect(proofManager.generateJwtProof(params)).resolves.toBeTruthy();
        });
      });

      describe('holderDid validation', () => {
        it('should throw error for empty holderDid', async () => {
          const params = { ...validParams, holderDid: '' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: holderDid is required and must be a non-empty string',
          );
        });

        it('should throw error for undefined holderDid', async () => {
          const params = { ...validParams, holderDid: undefined as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: holderDid is required and must be a non-empty string',
          );
        });

        it('should throw error for null holderDid', async () => {
          const params = { ...validParams, holderDid: null as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: holderDid is required and must be a non-empty string',
          );
        });

        it('should throw error for whitespace-only holderDid', async () => {
          const params = { ...validParams, holderDid: '   ' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: holderDid is required and must be a non-empty string',
          );
        });

        it('should throw error for non-string holderDid', async () => {
          const params = { ...validParams, holderDid: 123 as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: holderDid is required and must be a non-empty string',
          );
        });

        it('should throw error for holderDid not starting with "did:"', async () => {
          const params = { ...validParams, holderDid: 'example:holder123' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: DID must start with "did:"',
          );
        });

        it('should accept valid holderDid formats', async () => {
          const validDids = [
            'did:example:holder123',
            'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
            'did:web:example.com',
            'did:ethr:0x1234567890abcdef1234567890abcdef12345678',
          ];

          for (const did of validDids) {
            const params = { ...validParams, holderDid: did };
            await expect(proofManager.generateJwtProof(params)).resolves.toBeTruthy();
          }
        });
      });

      describe('issuerDid validation', () => {
        it('should throw error for empty issuerDid', async () => {
          const params = { ...validParams, issuerDid: '' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: issuerDid is required and must be a non-empty string',
          );
        });

        it('should throw error for undefined issuerDid', async () => {
          const params = { ...validParams, issuerDid: undefined as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: issuerDid is required and must be a non-empty string',
          );
        });

        it('should throw error for null issuerDid', async () => {
          const params = { ...validParams, issuerDid: null as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: issuerDid is required and must be a non-empty string',
          );
        });

        it('should throw error for whitespace-only issuerDid', async () => {
          const params = { ...validParams, issuerDid: '   ' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: issuerDid is required and must be a non-empty string',
          );
        });

        it('should throw error for non-string issuerDid', async () => {
          const params = { ...validParams, issuerDid: 123 as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: issuerDid is required and must be a non-empty string',
          );
        });

        it('should throw error for issuerDid not starting with "did:"', async () => {
          const params = { ...validParams, issuerDid: 'example:issuer456' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: DID must start with "did:"',
          );
        });

        it('should accept valid issuerDid formats', async () => {
          const validDids = [
            'did:example:issuer456',
            'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
            'did:web:issuer.example.com',
            'did:ethr:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          ];

          for (const did of validDids) {
            const params = { ...validParams, issuerDid: did };
            await expect(proofManager.generateJwtProof(params)).resolves.toBeTruthy();
          }
        });
      });

      describe('nonce validation', () => {
        it('should throw error for empty nonce', async () => {
          const params = { ...validParams, nonce: '' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: nonce is required and must be a non-empty string',
          );
        });

        it('should throw error for undefined nonce', async () => {
          const params = { ...validParams, nonce: undefined as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: nonce is required and must be a non-empty string',
          );
        });

        it('should throw error for null nonce', async () => {
          const params = { ...validParams, nonce: null as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: nonce is required and must be a non-empty string',
          );
        });

        it('should throw error for whitespace-only nonce', async () => {
          const params = { ...validParams, nonce: '   ' };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: nonce is required and must be a non-empty string',
          );
        });

        it('should throw error for non-string nonce', async () => {
          const params = { ...validParams, nonce: 123 as any };

          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            'Failed to generate JWT proof: nonce is required and must be a non-empty string',
          );
        });

        it('should accept various valid nonce formats', async () => {
          const validNonces = [
            'simple-nonce',
            '12345',
            'uuid-like-nonce-12345678-1234-1234-1234-123456789012',
            'special-chars-!@#$%^&*()_+-={}[]|\\:";\'<>?,./',
            'very-long-nonce-that-contains-many-characters-and-should-still-be-valid',
          ];

          for (const nonce of validNonces) {
            const params = { ...validParams, nonce };
            await expect(proofManager.generateJwtProof(params)).resolves.toBeTruthy();
          }
        });
      });
    });

    describe('edge cases and error scenarios', () => {
      it('should handle multiple validation errors by throwing the first one', async () => {
        const params = {
          privateKey: '',
          holderDid: '',
          issuerDid: '',
          nonce: '',
        };

        await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
          'Failed to generate JWT proof: privateKey is required and must be a non-empty string',
        );
      });

      it('should handle completely invalid params object', async () => {
        const params = {} as ProofParams;

        await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
          'Failed to generate JWT proof:',
        );
      });

      it('should maintain error message structure for all validation errors', async () => {
        const invalidParams = [
          { ...validParams, privateKey: '' },
          { ...validParams, holderDid: '' },
          { ...validParams, issuerDid: '' },
          { ...validParams, nonce: '' },
        ];

        for (const params of invalidParams) {
          await expect(proofManager.generateJwtProof(params)).rejects.toThrow(
            /^Failed to generate JWT proof:/,
          );
        }
      });

      it('should generate Base64URL encoded components without padding', async () => {
        const proof = await proofManager.generateJwtProof(validParams);
        const [headerB64, payloadB64, signatureB64] = proof.split('.');

        // Base64URL should not contain padding characters
        expect(headerB64).not.toContain('=');
        expect(payloadB64).not.toContain('=');
        expect(signatureB64).not.toContain('=');

        // Base64URL should not contain standard Base64 characters
        expect(headerB64).not.toContain('+');
        expect(headerB64).not.toContain('/');
        expect(payloadB64).not.toContain('+');
        expect(payloadB64).not.toContain('/');
        expect(signatureB64).not.toContain('+');
        expect(signatureB64).not.toContain('/');
      });

      it('should generate different proofs at different timestamps', async () => {
        const proof1 = await proofManager.generateJwtProof(validParams);

        // Wait to ensure different timestamp
        await new Promise((resolve) => setTimeout(resolve, 1100));

        const proof2 = await proofManager.generateJwtProof(validParams);

        expect(proof1).not.toBe(proof2);
      });
    });

    describe('constructor and instance creation', () => {
      it('should create new instance successfully', () => {
        const manager = new ProofManager();
        expect(manager).toBeInstanceOf(ProofManager);
      });

      it('should create multiple independent instances', () => {
        const manager1 = new ProofManager();
        const manager2 = new ProofManager();

        expect(manager1).toBeInstanceOf(ProofManager);
        expect(manager2).toBeInstanceOf(ProofManager);
        expect(manager1).not.toBe(manager2);
      });

      it('should have generateJwtProof method', () => {
        const manager = new ProofManager();
        expect(typeof manager.generateJwtProof).toBe('function');
      });
    });

    describe('integration with crypto libraries', () => {
      it('should produce valid secp256k1 signatures', async () => {
        const proof = await proofManager.generateJwtProof(validParams);
        const [, , signatureB64] = proof.split('.');

        // Decode signature and verify it's the expected length for secp256k1 compact format
        const signatureBytes = Buffer.from(
          signatureB64.replace(/-/g, '+').replace(/_/g, '/'),
          'base64',
        );

        // secp256k1 compact signature should be 64 bytes (32 bytes r + 32 bytes s)
        expect(signatureBytes.length).toBe(64);
      });

      it('should handle edge case private keys', async () => {
        // Test with minimum valid private key (1)
        const minKey = '0000000000000000000000000000000000000000000000000000000000000001';
        const params1 = { ...validParams, privateKey: minKey };

        await expect(proofManager.generateJwtProof(params1)).resolves.toBeTruthy();

        // Test with maximum valid private key (n-1 where n is secp256k1 order)
        const maxKey = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140';
        const params2 = { ...validParams, privateKey: maxKey };

        await expect(proofManager.generateJwtProof(params2)).resolves.toBeTruthy();
      });
    });
  });
});
