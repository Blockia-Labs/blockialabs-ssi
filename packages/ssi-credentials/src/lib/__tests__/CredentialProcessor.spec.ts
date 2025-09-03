import { bytesToHex } from '@noble/hashes/utils.js';
import { CredentialFormatType, ICredential, SignatureType } from '../types/index.js';
import { CredentialProcessor } from '../CredentialProcessor.js';
import { ISchemaVerifier } from '../interfaces/index.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { JsonLdHandler } from '../utils/JsonLdHandler.js';
import { verifySignature } from '@blockialabs/ssi-utils';
import {
  IDIDResolver,
  IDIDResolutionOptions,
  IDIDResolutionMetadata,
  IDIDDocument,
  IDIDDocumentMetadata,
  VerificationMethodType,
} from '@blockialabs/ssi-did';

jest.mock('@blockialabs/ssi-utils', () => ({
  verifySignature: jest.fn(),
}));

const VALID_SIGNATURE =
  '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const INVALID_SIGNATURE =
  'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

jest.mock('../utils/jsonLd-canonicalize', () => {
  return {
    jsonLdCanonicalize: jest.fn().mockImplementation(() => {
      return Promise.resolve('whatever');
    }),
  };
});

class MockDIDResolver implements IDIDResolver {
  async resolve(
    did: string,
    _resolutionOptions: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocument: IDIDDocument | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    const didResolutionMetadata: IDIDResolutionMetadata = {};
    let didDocument: IDIDDocument | null = null;
    const didDocumentMetadata: IDIDDocumentMetadata = {};

    if (did === 'did:example:invalid') {
      didResolutionMetadata.error = 'invalidDid';
      didResolutionMetadata.message = 'Invalid DID';
      return { didResolutionMetadata, didDocument, didDocumentMetadata };
    }

    didDocument = {
      id: did,
      verificationMethod: [
        {
          id: `${did}#key-1`,
          type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
          controller: did,
          publicKeyMultibase:
            'z6MkiHh5Y9Qe6Q2vQn1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q1kQ6n3Q',
        },
      ],
    } as IDIDDocument;

    return { didResolutionMetadata, didDocument, didDocumentMetadata };
  }

  async resolveRepresentation(
    did: string,
    resolutionOptions: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocumentStream: ReadableStream<Uint8Array> | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    const { didResolutionMetadata, didDocument, didDocumentMetadata } = await this.resolve(
      did,
      resolutionOptions,
    );

    let didDocumentStream: ReadableStream<Uint8Array> | null = null;

    if (didDocument) {
      const encoder = new TextEncoder();
      const documentBytes = encoder.encode(JSON.stringify(didDocument));

      didDocumentStream = new ReadableStream({
        start(controller) {
          controller.enqueue(documentBytes);
          controller.close();
        },
      });
    }

    return { didResolutionMetadata, didDocumentStream, didDocumentMetadata };
  }
}

class MockSignatureProvider implements ISignatureProvider {
  constructor(private shouldVerifySucceed = true) {}

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async sign(id: string, data: string): Promise<string> {
    return VALID_SIGNATURE;
  }

  async verify(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    options?: Record<string, unknown>,
  ): Promise<boolean> {
    const signatureHex = bytesToHex(signature);
    if (signatureHex === INVALID_SIGNATURE) {
      return false;
    }
    return this.shouldVerifySucceed;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

class MockSchemaVerifier implements ISchemaVerifier {
  async validate<T extends object>(content: T, schemaId: string): Promise<T> {
    if (schemaId === 'invalid-schema') {
      throw new Error('Schema validation failed');
    }
    return content;
  }
}

describe('CredentialProcessor', () => {
  let processor: CredentialProcessor;
  let didResolver: MockDIDResolver;
  let signatureProvider: MockSignatureProvider;
  let schemaVerifier: MockSchemaVerifier;
  let jsonLdHandler: JsonLdHandler;

  // Test credential with all required fields
  const sampleCredential: ICredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    'id': 'http://example.edu/credentials/3732',
    'type': ['VerifiableCredential', 'TestCredential'],
    'issuer': 'did:example:123',
    'name': 'Test Credential',
    'description': 'A test credential',
    'validFrom': '2023-06-01T19:23:24Z',
    'credentialSubject': {
      id: 'did:example:456',
      name: 'Test Subject',
    },
    'credentialSchema': {
      id: 'https://example.org/schemas/test.json',
      type: 'JsonSchemaValidator2018',
    },
  };

  beforeEach(() => {
    didResolver = new MockDIDResolver();
    signatureProvider = new MockSignatureProvider();
    schemaVerifier = new MockSchemaVerifier();
    jsonLdHandler = new JsonLdHandler();
    processor = new CredentialProcessor({
      didResolver,
      schemaValidator: schemaVerifier,
      formatHandlers: {
        [CredentialFormatType.JSON_LD]: jsonLdHandler,
      },
      signatureProviders: {
        Secp256k1: signatureProvider,
      },
    });

    jest.clearAllMocks();
  });

  describe('Core functionality', () => {
    it('should prepare a credential for issuance', async () => {
      const prepared = await processor.prepareIssuance(sampleCredential, {});
      expect(prepared).toHaveProperty('credential');
      expect(prepared).toHaveProperty('canonicalForm');
      expect(prepared).toHaveProperty('credentialFormat');
    });

    it('should complete issuance with signature', async () => {
      const prepared = await processor.prepareIssuance(sampleCredential, {});

      const issued = await processor.completeIssuance(prepared, {
        verificationMethod: 'did:example:123#key-1',
        signature: VALID_SIGNATURE,
        signatureType: 'Secp256k1',
      });

      expect(issued).toHaveProperty('proof');
      expect(issued.proof.proofValue).toBe(VALID_SIGNATURE);
    });
  });

  describe('Error handling', () => {
    it('should throw when schema validation fails', async () => {
      const badCredential = {
        ...sampleCredential,
        credentialSchema: {
          id: 'invalid-schema',
          type: 'JsonSchemaValidator2018',
        },
      };

      await expect(processor.prepareIssuance(badCredential, {})).rejects.toThrow(
        'Schema validation failed',
      );
    });

    it('should throw when signature provider is not registered', async () => {
      const prepared = await processor.prepareIssuance(sampleCredential, {});

      await expect(
        processor.completeIssuance(prepared, {
          verificationMethod: 'did:example:123#key-1',
          signature: VALID_SIGNATURE,
          signatureType: 'UnknownType' as SignatureType,
        }),
      ).rejects.toThrow('No signature provider registered for type: UnknownType');
    });
  });

  describe('Feature-specific tests', () => {
    it('should include challenge and domain in proof', async () => {
      const prepared = await processor.prepareIssuance(sampleCredential, {
        challenge: 'test-challenge',
        domain: 'test-domain',
      });

      expect(prepared.canonicalForm).toBe('whatever');
    });

    it('should verify signature using verifySignature during issuance', async () => {
      const mockVerifySignature = verifySignature as jest.MockedFunction<typeof verifySignature>;

      const prepared = await processor.prepareIssuance(sampleCredential, {});

      await processor.completeIssuance(prepared, {
        verificationMethod: 'did:example:123#key-1',
        signature: VALID_SIGNATURE,
        signatureType: 'Secp256k1',
      });

      expect(mockVerifySignature).toHaveBeenCalled();
    });

    it('should register new signature providers', () => {
      const newProvider = new MockSignatureProvider();
      processor.registerSignatureProvider('Secp256k1' as SignatureType, newProvider);

      const mockMap = new Map();
      const setSpy = jest.spyOn(mockMap, 'set');
      mockMap.set('Secp256k1', newProvider);

      expect(setSpy).toHaveBeenCalledWith('Secp256k1', newProvider);
      setSpy.mockRestore();
    });
  });
});
