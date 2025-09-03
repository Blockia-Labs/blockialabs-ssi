import { base58 } from '@scure/base';
import { hexToBytes } from '@noble/hashes/utils.js';
import {
  IDIDMethod,
  VerificationMethodType,
  IDIDDocument,
  DIDDocumentBuilder,
  ProofPurpose,
  IDIDDocumentMetadata,
} from '@blockialabs/ssi-did';

export class KeyDIDMethod implements IDIDMethod {
  private createVerificationMethod(did: string, identifier: string) {
    return {
      id: `${did}#controllerKey`,
      type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
      controller: did,
      publicKeyMultibase: `z${identifier}`,
    };
  }

  /**
   * Creates a new DID and its DID Document, including issuer proof.
   * @param options - Method-specific options, including publicKeyHex, signature, and keyId.
   * @returns - Object containing the DID and its DID Document.
   * @throws - Error if publicKeyHex is missing.
   */
  async create(options: {
    publicKeyHex: string;
    keyId?: string;
    signature?: string;
    signatureType?: string;
  }): Promise<{ did: string; didDocument: IDIDDocument }> {
    if (!options.publicKeyHex) {
      throw new Error('publicKeyHex is required');
    }
    const publicKeyBytes = hexToBytes(options.publicKeyHex);
    const methodSpecificId = base58.encode(publicKeyBytes);

    const did = `did:key:${methodSpecificId}`;
    const verificationMethod = this.createVerificationMethod(did, methodSpecificId);

    const builder = DIDDocumentBuilder.create(did)
      .withContext(['https://www.w3.org/ns/did/v1'])
      .withController(did)
      .withVerificationMethod([verificationMethod])
      .withAuthentication([verificationMethod.id])
      .withAssertionMethod([verificationMethod.id]);

    if (options.signature && options.signatureType && options.keyId) {
      builder.addProof({
        id: options.keyId,
        type: options.signatureType,
        created: new Date().toISOString(),
        verificationMethod: verificationMethod.id,
        proofPurpose: ProofPurpose.Authentication,
        proofValue: options.signature,
      });
    }

    return {
      did,
      didDocument: builder.buildAndSeal(),
    };
  }

  /**
   * Resolves a DID to its DID Document and metadata.
   * @param did - The DID to resolve.
   * @returns The resolved DID Document and metadata.
   */
  async resolve(
    did: string,
  ): Promise<{ didDocument: IDIDDocument | null; metadata: IDIDDocumentMetadata }> {
    const parts = did.split(':');
    if (parts.length !== 3 || parts[0] !== 'did' || parts[1] !== 'key') {
      throw new Error('Invalid did:key format');
    }

    const methodSpecificId = parts[2];

    try {
      if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(methodSpecificId)) {
        throw new Error('Invalid method-specific-id');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage !== 'Invalid method-specific-id') {
        throw error;
      }

      throw new Error('Invalid method-specific-id');
    }

    const verificationMethod = this.createVerificationMethod(did, methodSpecificId);

    const builder = DIDDocumentBuilder.create(did)
      .withContext(['https://www.w3.org/ns/did/v1'])
      .withController(did)
      .withVerificationMethod([verificationMethod])
      .withAuthentication([verificationMethod.id])
      .withAssertionMethod([verificationMethod.id])
      .withKeyAgreement([]);

    return {
      didDocument: builder.buildAndSeal(),
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        deactivated: false,
      },
    };
  }

  /**
   * Updates an existing DID Document.
   * @param did - The DID to update.
   * @param didDocument - The updated DID Document.
   * @param options - Options containing the publicKeyHex, signature, keyId, and signatureType.
   * @returns The updated DID Document.
   * @throws Error if DID doesn't match.
   */
  public async update(
    did: string,
    didDocument: IDIDDocument,
    options: {
      publicKeyHex: string;
      signature?: string;
      keyId?: string;
      signatureType?: string;
    },
  ): Promise<IDIDDocument> {
    if (didDocument.id !== did) {
      throw new Error('DID Document id does not match the DID being updated.');
    }

    if (!options.publicKeyHex) {
      throw new Error('publicKeyHex is required');
    }

    const methodSpecificId = did.split(':')[2];
    const decodedKey = base58.decode(methodSpecificId);
    const publicKeyBytes = hexToBytes(options.publicKeyHex);
    if (!publicKeyBytes.every((val, index) => val === decodedKey[index])) {
      throw new Error('Public key does not match DID controller');
    }

    const documentBuilder = DIDDocumentBuilder.create(did)
      .withContext(didDocument['@context'] || ['https://www.w3.org/ns/did/v1'])
      .withController(didDocument.controller || did)
      .withVerificationMethod(didDocument.verificationMethod || [])
      .withAuthentication(didDocument.authentication || [])
      .withAssertionMethod(didDocument.assertionMethod || [])
      .withKeyAgreement(didDocument.keyAgreement || []);

    if (options.signature && options.keyId) {
      documentBuilder.addProof({
        id: options.keyId,
        type: options.signatureType || 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        verificationMethod: `${did}#controllerKey`,
        proofPurpose: ProofPurpose.Authentication,
        proofValue: options.signature,
      });
    }

    if (didDocument.service) {
      documentBuilder.withServices(didDocument.service);
    }
    if (didDocument.linkedResource) {
      documentBuilder.withLinkedResources(didDocument.linkedResource);
    }

    return documentBuilder.buildAndSeal();
  }

  /**
   * Deactivates a DID.
   * @param did - The DID to deactivate.
   * @param options - Options containing the publicKeyHex, signature, keyId, and signatureType.
   * @returns The deactivated DID Document and metadata.
   */
  public async deactivate(
    did: string,
    options: {
      publicKeyHex: string;
      signature?: string;
      keyId?: string;
      signatureType?: string;
    },
  ): Promise<{ didDocument: IDIDDocument | null; metadata: IDIDDocumentMetadata }> {
    const { didDocument, metadata } = await this.resolve(did);

    if (!options.publicKeyHex) {
      throw new Error('publicKeyHex is required');
    }

    const methodSpecificId = did.split(':')[2];
    const decodedKey = base58.decode(methodSpecificId);
    const publicKeyBytes = hexToBytes(options.publicKeyHex);
    if (!publicKeyBytes.every((val, index) => val === decodedKey[index])) {
      throw new Error('Public key does not match DID controller');
    }

    const updatedMetadata = {
      ...metadata,
      deactivated: true,
      updated: new Date().toISOString(),
    };

    if (didDocument && options.signature && options.keyId) {
      const documentBuilder = DIDDocumentBuilder.create(did)
        .withContext(didDocument['@context'] || ['https://www.w3.org/ns/did/v1'])
        .withController(didDocument.controller || did)
        .withVerificationMethod(didDocument.verificationMethod || [])
        .withAuthentication(didDocument.authentication || [])
        .withAssertionMethod(didDocument.assertionMethod || [])
        .withKeyAgreement(didDocument.keyAgreement || []);

      documentBuilder.addProof({
        id: options.keyId,
        type: options.signatureType || 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        verificationMethod: `${did}#controllerKey`,
        proofPurpose: ProofPurpose.Authentication,
        proofValue: options.signature,
      });

      return {
        didDocument: documentBuilder.buildAndSeal(),
        metadata: updatedMetadata,
      };
    }

    return {
      didDocument: didDocument,
      metadata: updatedMetadata,
    };
  }
}
