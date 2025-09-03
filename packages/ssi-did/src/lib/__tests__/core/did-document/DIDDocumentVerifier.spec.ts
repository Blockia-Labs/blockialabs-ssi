import { DIDDocumentVerifier } from '../../../core/did-document/DIDDocumentVerifier.js';
import { IDIDDocument } from '../../../interfaces/did-document/IDIDDocument.js';
import { IProof } from '../../../interfaces/did-document/IProof.js';
import { ProofPurpose } from '../../../constants/ProofPurpose.js';
import { VerificationMethodType } from '../../../constants/VerificationMethodType.js';

describe('DIDDocumentVerifier', () => {
  // Valid sample DID document for testing
  const validDocument: IDIDDocument = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    'id': 'did:example:123456789abcdefghi',
    'verificationMethod': [
      {
        id: 'did:example:123456789abcdefghi#key-1',
        type: VerificationMethodType.JsonWebKey2020,
        controller: 'did:example:123456789abcdefghi',
        publicKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'FEzNJnuZJt8YA-zvEJ3Laj5xrUZ5KqLPpPCjFdnIgCQ',
          y: 'G5L4KeNicCC9ef9uNugnXFSQbZpUNN3c_A_5t4c-Yqc',
        },
      },
    ],
    'authentication': ['did:example:123456789abcdefghi#key-1'],
    'assertionMethod': ['did:example:123456789abcdefghi#key-1'],
    'service': [
      {
        id: 'did:example:123456789abcdefghi#service-1',
        type: 'DIDCommMessaging',
        serviceEndpoint: 'https://example.com/endpoint',
      },
    ],
    'proof': {
      id: 'did:example:123456789abcdefghi#proof-1',
      type: 'EcdsaSecp256k1Signature2019',
      created: '2023-07-20T12:30:00Z',
      proofPurpose: ProofPurpose.Authentication,
      verificationMethod: 'did:example:123456789abcdefghi#key-1',
      proofValue: 'z4oey5q2M3XKaxup3tmzN4DRFTLVqpLMweBrSxMY2xHX',
    },
  };

  describe('verify()', () => {
    test('should validate a well-formed DID document', () => {
      const result = DIDDocumentVerifier.verify(validDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required properties', () => {
      const documentWithoutId = { ...validDocument, id: undefined };
      const result = DIDDocumentVerifier.verify(documentWithoutId as unknown as IDIDDocument);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required property: id');
    });

    test('should detect invalid DID syntax', () => {
      const documentWithInvalidDID = { ...validDocument, id: 'invalid:did' };
      const result = DIDDocumentVerifier.verify(documentWithInvalidDID);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid DID: invalid:did');
    });

    test('should require W3C DID v1 context', () => {
      const documentWithoutContext = {
        ...validDocument,
        '@context': ['https://some-other-context.org'],
      };
      const result = DIDDocumentVerifier.verify(documentWithoutContext);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Missing required W3C DID v1 context (https://www.w3.org/ns/did/v1)',
      );
    });
  });

  describe('verifyVerificationMethods()', () => {
    test('should detect deprecated verification method properties and add warnings', () => {
      const documentWithDeprecatedProps: IDIDDocument = {
        ...validDocument,
        verificationMethod: [
          {
            id: 'did:example:123456789abcdefghi#key-deprecated',
            type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
            controller: 'did:example:123456789abcdefghi',
            publicKeyBase58: '8aS7MBFrEMj6aqDpDLrGheE2WfC9viosJXJZWxGFKHF',
          },
        ],
      };

      const result = DIDDocumentVerifier.verify(documentWithDeprecatedProps);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "Verification method at index 0 uses deprecated 'publicKeyBase58'. Consider using 'publicKeyMultibase' or 'publicKeyJwk' instead.",
      );
    });

    test('should detect multiple key material representations', () => {
      const documentWithMultipleKeyMaterials: IDIDDocument = {
        ...validDocument,
        verificationMethod: [
          {
            id: 'did:example:123456789abcdefghi#key-multiple',
            type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
            controller: 'did:example:123456789abcdefghi',
            publicKeyBase58: '8aS7MBFrEMj6aqDpDLrGheE2WfC9viosJXJZWxGFKHF',
            publicKeyMultibase: 'z6MkoNp7nHHjoQkKpXHpqh15JRc7i9yCgXHHvbMVS8KaY47V',
          },
        ],
      };

      const result = DIDDocumentVerifier.verify(documentWithMultipleKeyMaterials);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Verification method at index 0 has multiple key material representations: publicKeyMultibase, publicKeyBase58',
      );
    });

    test('should handle blockchain account IDs properly', () => {
      const documentWithBlockchainProps: IDIDDocument = {
        ...validDocument,
        verificationMethod: [
          {
            id: 'did:example:123456789abcdefghi#key-blockchain',
            type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
            controller: 'did:example:123456789abcdefghi',
            blockchainAccountId: 'eip155:1:0x123456789abcdefghi',
          },
        ],
      };

      const result = DIDDocumentVerifier.verify(documentWithBlockchainProps);
      expect(result.valid).toBe(true);
      // Should not have multiple key material error
      const multipleKeyError = result.errors.find((error) =>
        error.includes('multiple key material representations'),
      );
      expect(multipleKeyError).toBeUndefined();
    });
  });

  describe('verifyProofStructure()', () => {
    test('should validate a well-formed proof', () => {
      const result = DIDDocumentVerifier.verify(validDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required proof properties', () => {
      // Create a proper IProof with only the created property
      const incompleteProof: IProof = {
        created: '2023-07-20T12:30:00Z',
        proofPurpose: ProofPurpose.Authentication,
        verificationMethod: 'did:example:123456789abcdefghi#key-1',
        id: '', // Adding empty properties to satisfy TypeScript
        type: '',
        proofValue: '',
      };

      const documentWithInvalidProof: IDIDDocument = {
        ...validDocument,
        proof: incompleteProof,
      };

      const result = DIDDocumentVerifier.verify(documentWithInvalidProof);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Proof at index 0 is missing required 'id' property");
      expect(result.errors).toContain("Proof at index 0 is missing required 'type' property");
      expect(result.errors).toContain("Proof at index 0 is missing required 'proofValue' property");
    });

    test('should validate multiple proofs in an array', () => {
      const secondProof: IProof = {
        id: 'did:example:123456789abcdefghi#proof-2',
        type: 'EcdsaSecp256k1Signature2019',
        created: '2023-07-20T12:31:00Z',
        proofPurpose: ProofPurpose.AssertionMethod,
        verificationMethod: 'did:example:123456789abcdefghi#key-1',
        proofValue: 'z4oey5q2M3XKaxup3tmzN4DRFTLVqpLMweBrSxMY2xHY',
      };

      const documentWithMultipleProofs: IDIDDocument = {
        ...validDocument,
        proof: [validDocument.proof as IProof, secondProof],
      };

      const result = DIDDocumentVerifier.verify(documentWithMultipleProofs);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid created date in proof', () => {
      const invalidDateProof: IProof = {
        ...(validDocument.proof as IProof),
        created: 'not-a-date',
      };

      const documentWithInvalidDate: IDIDDocument = {
        ...validDocument,
        proof: invalidDateProof,
      };

      const result = DIDDocumentVerifier.verify(documentWithInvalidDate);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Proof at index 0 has invalid 'created' date: not-a-date");
    });
  });

  describe('cryptographicallyVerify()', () => {
    test('should return warnings when cryptographic verification is not implemented', async () => {
      const result = await DIDDocumentVerifier.cryptographicallyVerify(validDocument);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Cryptographic verification not implemented yet');
    });

    test('should warn when document has no proofs to verify', async () => {
      const documentWithoutProof: IDIDDocument = { ...validDocument, proof: undefined };
      const result = await DIDDocumentVerifier.cryptographicallyVerify(documentWithoutProof);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        'Document does not contain any proofs to cryptographically verify',
      );
    });
  });
});
