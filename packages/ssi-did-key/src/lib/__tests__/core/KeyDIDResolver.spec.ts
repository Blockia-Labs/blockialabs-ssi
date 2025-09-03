import { secp256k1 } from '@noble/curves/secp256k1.js';
import { KeyDIDMethod } from '../../core/KeyDIDMethod.js';
import { KeyDIDResolver } from '../../core/KeyDIDResolver.js';

describe('KeyDIDResolver', () => {
  let keyDIDMethod: KeyDIDMethod;
  let keyDIDResolver: KeyDIDResolver;
  let mockPublicKeyHex: string;

  beforeEach(async () => {
    keyDIDMethod = new KeyDIDMethod();
    keyDIDResolver = new KeyDIDResolver(keyDIDMethod);
    const privateKey = Buffer.from(
      '1c1179c0b9b9b398ac215aa77b9f2e52c44a6c171b94d84117af98298aebed76',
      'hex',
    );
    const publicKey = secp256k1.getPublicKey(privateKey, true);
    mockPublicKeyHex = Buffer.from(publicKey).toString('hex');
  });

  describe('resolve', () => {
    it('should resolve a valid DID', async () => {
      const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
      const result = await keyDIDResolver.resolve(did);
      expect(result.didDocument).toBeDefined();
      expect(result.didResolutionMetadata).toBeDefined();
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
      expect(result.didDocumentMetadata).toBeDefined();
    });

    it('should return an error for an invalid DID - invalid base58', async () => {
      const invalidDid = 'did:key:invalidbase58====';
      const result = await keyDIDResolver.resolve(invalidDid);
      expect(result.didDocument).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });

    it('should return an error for an invalid DID - invalid did method', async () => {
      const invalidDid = 'did:example:validBase58String';
      const result = await keyDIDResolver.resolve(invalidDid);
      expect(result.didDocument).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });

    it('should return an error for an invalid DID - missing method-specific-id', async () => {
      const invalidDid = 'did:key';
      const result = await keyDIDResolver.resolve(invalidDid);
      expect(result.didDocument).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });
  });

  describe('resolveRepresentation', () => {
    it('should resolve a valid DID to a stream with default accept type', async () => {
      const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
      const result = await keyDIDResolver.resolveRepresentation(did);
      expect(result.didDocumentStream).toBeDefined();
      expect(result.didResolutionMetadata).toBeDefined();
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
      expect(result.didDocumentMetadata).toBeDefined();

      const documentString = await new Response(result.didDocumentStream).text();
      const didDocument = JSON.parse(documentString);
      expect(didDocument.id).toBe(did);
    });

    it('should resolve a valid DID to a stream with application/did+ld+json accept type', async () => {
      const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
      const result = await keyDIDResolver.resolveRepresentation(did, {
        accept: 'application/did+ld+json',
      });
      expect(result.didDocumentStream).toBeDefined();
      expect(result.didResolutionMetadata).toBeDefined();
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
      expect(result.didDocumentMetadata).toBeDefined();

      const documentString = await new Response(result.didDocumentStream).text();
      const didDocument = JSON.parse(documentString);
      expect(didDocument.id).toBe(did);
    });

    it('should resolve a valid DID to a stream with application/did+json accept type', async () => {
      const { did } = await keyDIDMethod.create({ publicKeyHex: mockPublicKeyHex });
      const result = await keyDIDResolver.resolveRepresentation(did, {
        accept: 'application/did+json',
      });
      expect(result.didDocumentStream).toBeDefined();
      expect(result.didResolutionMetadata).toBeDefined();
      expect(result.didResolutionMetadata.contentType).toBe('application/did+json');
      expect(result.didDocumentMetadata).toBeDefined();

      const documentString = await new Response(result.didDocumentStream).text();
      const didDocument = JSON.parse(documentString);
      expect(didDocument.id).toBe(did);
    });

    it('should return an error for an invalid DID for resolveRepresentation', async () => {
      const invalidDid = 'did:key:invalidbase58====';
      const result = await keyDIDResolver.resolveRepresentation(invalidDid);
      expect(result.didDocumentStream).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });
  });
});
