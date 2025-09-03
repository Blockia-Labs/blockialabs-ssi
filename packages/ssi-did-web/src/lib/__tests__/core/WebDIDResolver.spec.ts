import axios from 'axios';
import { IDIDDocument } from '@blockialabs/ssi-did';
import { WebDIDResolver } from '../../core/WebDIDResolver.js';

jest.mock('axios');

describe('WebDIDResolver', () => {
  let webDIDResolver: WebDIDResolver;

  beforeEach(() => {
    webDIDResolver = new WebDIDResolver();
    jest.clearAllMocks();
  });

  describe('resolve', () => {
    it('should resolve a valid DID', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolve(did);

      expect(result.didDocument).toEqual(mockDIDDocument);
      expect(result.didResolutionMetadata).toEqual({ contentType: 'application/did+ld+json' });
      expect(axios.get).toHaveBeenCalledWith(`https://${domain}/.well-known/did.json`);
    });

    it('should return resolution metadata with content type for valid DID', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolve(did);
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
    });

    it('should return an error for an invalid DID format', async () => {
      const invalidDid = 'did:invalid:example.com';
      const result = await webDIDResolver.resolve(invalidDid);

      expect(result.didDocument).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });

    it('should return resolution metadata with error for invalid DID format', async () => {
      const invalidDid = 'did:invalid:example.com';
      const result = await webDIDResolver.resolve(invalidDid);
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });

    it('should return an error if fetching the DID document fails', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;

      // Mock the axios error
      (axios.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch DID Document'));

      const result = await webDIDResolver.resolve(did);

      expect(result.didDocument).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });

    it('should return resolution metadata with error if fetching fails', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      (axios.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch DID Document'));

      const result = await webDIDResolver.resolve(did);
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });
  });

  describe('resolveRepresentation', () => {
    it('should resolve a valid DID to a stream with default accept type', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };

      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolveRepresentation(did);

      expect(result.didDocumentStream).toBeDefined();
      expect(result.didResolutionMetadata).toEqual({ contentType: 'application/did+ld+json' });

      const documentString = await new Response(result.didDocumentStream).text();
      const didDocument = JSON.parse(documentString);
      expect(didDocument).toEqual(mockDIDDocument);
    });

    it('should return resolution metadata with default content type for resolveRepresentation', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolveRepresentation(did);
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
    });

    it('should resolve a valid DID to a stream with application/did+ld+json accept type', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolveRepresentation(did, {
        accept: 'application/did+ld+json',
      });

      expect(result.didDocumentStream).toBeDefined();
      expect(result.didResolutionMetadata).toEqual({ contentType: 'application/did+ld+json' });
      const documentString = await new Response(result.didDocumentStream).text();
      const didDocument = JSON.parse(documentString);
      expect(didDocument).toEqual(mockDIDDocument);
    });

    it('should return resolution metadata with correct content type for application/did+ld+json accept', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolveRepresentation(did, {
        accept: 'application/did+ld+json',
      });
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
    });

    it('should resolve a valid DID to a stream with application/did+json accept type', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolveRepresentation(did, {
        accept: 'application/did+json',
      });

      expect(result.didDocumentStream).toBeDefined();
      expect(result.didResolutionMetadata).toEqual({ contentType: 'application/did+json' });
      const documentString = await new Response(result.didDocumentStream).text();
      const didDocument = JSON.parse(documentString);
      expect(didDocument).toEqual(mockDIDDocument);
    });

    it('should return resolution metadata with correct content type for application/did+json accept', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });

      const result = await webDIDResolver.resolveRepresentation(did, {
        accept: 'application/did+json',
      });
      expect(result.didResolutionMetadata.contentType).toBe('application/did+json');
    });

    it('should return an error for an invalid DID format for resolveRepresentation', async () => {
      const invalidDid = 'did:invalid:example.com';
      const result = await webDIDResolver.resolveRepresentation(invalidDid);

      expect(result.didDocumentStream).toBeNull();
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });

    it('should return resolution metadata with error for invalid DID format for resolveRepresentation', async () => {
      const invalidDid = 'did:invalid:example.com';
      const result = await webDIDResolver.resolveRepresentation(invalidDid);
      expect(result.didResolutionMetadata.error).toBe('invalidDid');
    });
  });
});
