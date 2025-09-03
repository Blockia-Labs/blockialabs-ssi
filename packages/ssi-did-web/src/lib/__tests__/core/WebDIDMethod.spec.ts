import axios from 'axios';
import { WebDIDMethod } from '../../core/WebDIDMethod.js';
import { IDIDDocument, VerificationMethodType } from '@blockialabs/ssi-did';

jest.mock('axios');

describe('WebDIDMethod', () => {
  let webDIDMethod: WebDIDMethod;
  const mockPublicKeyHex = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'; // Example public key
  const expectedPublicKeyMultibase = 'z1thX6LZfHDZZKUs92febYZhYRcXddmzfzF2NvTkPNE'; // Base58 encoding of mockPublicKeyHex

  beforeEach(() => {
    webDIDMethod = new WebDIDMethod();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new DID and save the DID document to the domain', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': ['https://www.w3.org/ns/did/v1'],
        'id': did,
        'controller': did,
        'verificationMethod': [
          {
            id: `${did}#controllerKey`,
            type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
            controller: did,
            publicKeyMultibase: expectedPublicKeyMultibase,
          },
        ],
        'authentication': [`${did}#controllerKey`],
        'assertionMethod': [`${did}#controllerKey`],
      };

      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await webDIDMethod.create({ domain, publicKeyHex: mockPublicKeyHex });

      expect(result.did).toBe(did);
      expect(result.didDocument).toEqual(mockDIDDocument);
      expect(axios.post).toHaveBeenCalledWith(
        `https://${domain}/.well-known/did.json`,
        mockDIDDocument,
      );
    });

    it('should throw an error if domain is not provided', async () => {
      await expect(webDIDMethod.create({ publicKeyHex: mockPublicKeyHex } as any)).rejects.toThrow(
        'Domain is required for did:web method',
      );
    });

    it('should throw an error if publicKeyHex is not provided', async () => {
      await expect(webDIDMethod.create({ domain: 'example.com' } as any)).rejects.toThrow(
        'publicKeyHex is required for did:web DID Document.',
      );
    });

    it('should throw an error if saving to domain fails', async () => {
      const domain = 'example.com';
      (axios.post as jest.Mock).mockRejectedValue(new Error('Failed to save'));

      await expect(webDIDMethod.create({ domain, publicKeyHex: mockPublicKeyHex })).rejects.toThrow(
        `Failed to save DID Document to domain: ${domain}`,
      );
    });

    it('should include proof if signature and keyId are provided', async () => {
      const domain = 'example.com';
      const signature = 'mockSignature';
      const keyId = 'mockKeyId';
      const signatureType = 'EcdsaSecp256k1Signature2019';
      const did = `did:web:${domain}`;

      const mockDIDDocumentWithProof: IDIDDocument = {
        '@context': ['https://www.w3.org/ns/did/v1'],
        'id': did,
        'controller': did,
        'verificationMethod': [
          {
            id: `${did}#controllerKey`,
            type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
            controller: did,
            publicKeyMultibase: expectedPublicKeyMultibase,
          },
        ],
        'authentication': [`${did}#controllerKey`],
        'assertionMethod': [`${did}#controllerKey`],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
        'proof': expect.anything(),
      };

      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      await webDIDMethod.create({
        domain,
        publicKeyHex: mockPublicKeyHex,
        signature,
        keyId,
        signatureType,
      });

      expect(axios.post).toHaveBeenCalledWith(
        `https://${domain}/.well-known/did.json`,
        expect.objectContaining({ proof: expect.anything() }),
      );
    });
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

      const result = await webDIDMethod.resolve(did);

      expect(result.didDocument).toEqual(mockDIDDocument);
      expect(axios.get).toHaveBeenCalledWith(`https://${domain}/.well-known/did.json`);
    });

    it('should throw an error for an invalid DID format', async () => {
      const invalidDid = 'did:invalid:example.com';
      await expect(webDIDMethod.resolve(invalidDid)).rejects.toThrow('Invalid did:web format');
    });

    it('should throw an error if fetching the DID document fails', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      (axios.get as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

      await expect(webDIDMethod.resolve(did)).rejects.toThrow(
        `Failed to fetch DID Document from domain: ${domain}`,
      );
    });
  });

  describe('update', () => {
    it('should update a DID document and save it to the domain', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'controller': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      const signature = 'mockUpdateSignature';
      const keyId = 'mockUpdateKeyId';

      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await webDIDMethod.update(did, mockDIDDocument, {
        publicKeyHex: mockPublicKeyHex,
        signature,
        keyId,
      });

      expect(result.id).toBe(did);
      expect(axios.post).toHaveBeenCalledWith(
        `https://${domain}/.well-known/did.json`,
        expect.objectContaining({ proof: expect.anything() }),
      );
    });

    it('should throw an error if DID does not match document ID', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': 'did:web:wrongdomain.com', // ID mismatch
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };

      await expect(
        webDIDMethod.update(did, mockDIDDocument, {
          publicKeyHex: mockPublicKeyHex,
          signature: 'sig',
          keyId: 'kid',
        }),
      ).rejects.toThrow('DID Document id does not match the DID being updated.');
    });

    it('should add a proof when signature and keyId are provided for update', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'controller': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      const signature = 'mockUpdateSignature';
      const keyId = 'mockUpdateKeyId';

      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await webDIDMethod.update(did, mockDIDDocument, {
        publicKeyHex: mockPublicKeyHex,
        signature,
        keyId,
      });

      expect(result.proof).toBeDefined();
      expect(axios.post).toHaveBeenCalledWith(
        `https://${domain}/.well-known/did.json`,
        expect.objectContaining({ proof: expect.anything() }),
      );
    });

    it('should throw an error if update to domain fails', async () => {
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
      const signature = 'mockUpdateSignature';
      const keyId = 'mockUpdateKeyId';
      (axios.post as jest.Mock).mockRejectedValue(new Error('Failed to update'));

      await expect(
        webDIDMethod.update(did, mockDIDDocument, {
          publicKeyHex: mockPublicKeyHex,
          signature,
          keyId,
        }),
      ).rejects.toThrow(`Failed to save updated DID Document to domain: ${domain}`);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a DID and update the metadata', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      const mockDIDDocument: IDIDDocument = {
        '@context': 'https://www.w3.org/ns/did/v1',
        'id': did,
        'controller': did,
        'verificationMethod': [],
        'authentication': [],
        'assertionMethod': [],
        'keyAgreement': [],
        'capabilityInvocation': [],
        'capabilityDelegation': [],
        'service': [],
      };
      const signature = 'mockDeactivateSignature';
      const keyId = 'mockDeactivateKeyId';

      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });
      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await webDIDMethod.deactivate(did, {
        publicKeyHex: mockPublicKeyHex,
        signature,
        keyId,
      });

      expect(result.metadata.deactivated).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        `https://${domain}/.well-known/did.json`,
        expect.objectContaining({ proof: expect.anything() }),
      );
    });

    it('should throw an error if resolve fails during deactivation', async () => {
      const domain = 'example.com';
      const did = `did:web:${domain}`;
      (axios.get as jest.Mock).mockRejectedValue(new Error('Failed to resolve'));

      await expect(
        webDIDMethod.deactivate(did, {
          publicKeyHex: mockPublicKeyHex,
          signature: 'sig',
          keyId: 'kid',
        }),
      ).rejects.toThrow('Failed to fetch DID Document from domain: example.com');
    });

    it('should throw an error if deactivate to domain fails', async () => {
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
      const signature = 'mockDeactivateSignature';
      const keyId = 'mockDeactivateKeyId';

      (axios.get as jest.Mock).mockResolvedValue({ data: mockDIDDocument });
      (axios.post as jest.Mock).mockRejectedValue(new Error('Failed to deactivate'));

      await expect(
        webDIDMethod.deactivate(did, { publicKeyHex: mockPublicKeyHex, signature, keyId }),
      ).rejects.toThrow(`Failed to save deactivated DID Document to domain: ${domain}`);
    });
  });
});
