import axios from 'axios';
import { base58 } from '@scure/base';
import {
  DIDDocumentBuilder,
  IDIDDocument,
  IDIDDocumentMetadata,
  IDIDMethod,
  ProofPurpose,
  VerificationMethodType,
} from '@blockialabs/ssi-did';

export class WebDIDMethod implements IDIDMethod {
  /**
   * Creates a new DID and its DID Document.
   * @param options - Method-specific options including publicKeyHex, signature, and keyId.
   * @returns The DID and its DID Document.
   */
  public async create(options: {
    publicKeyHex: string;
    domain: string;
    signature?: string;
    keyId?: string;
    signatureType?: string;
  }): Promise<{ did: string; didDocument: IDIDDocument }> {
    if (!options?.domain) {
      throw new Error('Domain is required for did:web method');
    }
    if (!options?.publicKeyHex) {
      throw new Error('publicKeyHex is required for did:web DID Document.');
    }
    const publicKeyRaw: Buffer = Buffer.from(options.publicKeyHex, 'hex');
    const did = `did:web:${options.domain}`;
    const controllerKeyId = `${did}#controllerKey`;
    const verificationMethod = {
      id: controllerKeyId,
      type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
      controller: did,
      publicKeyMultibase: `z${base58.encode(publicKeyRaw)}`,
    };
    const didDocumentBuilder = DIDDocumentBuilder.create(did)
      .withContext(['https://www.w3.org/ns/did/v1'])
      .withController(did)
      .withVerificationMethod([verificationMethod])
      .withAuthentication([controllerKeyId])
      .withAssertionMethod([controllerKeyId]);
    if (options.signature && options.keyId) {
      didDocumentBuilder.addProof({
        id: options.keyId || `${did}#creation-${Date.now()}`,
        type: options.signatureType || 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        verificationMethod: controllerKeyId,
        proofPurpose: ProofPurpose.Authentication,
        proofValue: options.signature,
      });
    }
    const didDocument = didDocumentBuilder.buildAndSeal();
    try {
      await axios.post(`https://${options.domain}/.well-known/did.json`, didDocument);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to save DID Document to domain: ${options.domain}, Reason : ${message}`,
      );
    }
    return { did, didDocument };
  }

  /**
   * Resolves a DID to its DID Document and metadata.
   * @param did - The DID to resolve.
   * @param options - Optional resolution parameters.
   * @returns The resolved DID Document and metadata.
   */
  public async resolve(
    did: string,
    options?: Record<string, unknown>,
  ): Promise<{ didDocument: IDIDDocument | null; metadata: IDIDDocumentMetadata }> {
    const parts = did.split(':');
    if (parts.length !== 3 || parts[0] !== 'did' || parts[1] !== 'web') {
      throw new Error('Invalid did:web format');
    }
    const domain = parts[2];
    try {
      const response = await axios.get(`https://${domain}/.well-known/did.json`);
      const didDocument = response.data;
      return {
        didDocument,
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          deactivated: false,
        },
      };
    }catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch DID Document from domain: ${domain}, Reason : ${message}`);
    }
  }

  /**
   * Updates an existing DID Document.
   * @param did - The DID to update.
   * @param didDocument - The updated DID Document.
   * @param options - Method-specific options including publicKeyHex, signature, keyId, and signatureType.
   * @returns The updated DID Document.
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
    const documentBuilder = DIDDocumentBuilder.create(did)
      .withContext(didDocument['@context'] || ['https://www.w3.org/ns/did/v1'])
      .withController(didDocument.controller || did)
      .withVerificationMethod(didDocument.verificationMethod || [])
      .withAuthentication(didDocument.authentication || [])
      .withAssertionMethod(didDocument.assertionMethod || []);
    if (didDocument.service) {
      documentBuilder.withServices(didDocument.service);
    }
    if (didDocument.keyAgreement) {
      documentBuilder.withKeyAgreement(didDocument.keyAgreement);
    }
    if (didDocument.linkedResource) {
      documentBuilder.withLinkedResources(didDocument.linkedResource);
    }
    if (options?.signature && options?.keyId) {
      documentBuilder.addProof({
        id: options.keyId || `${did}#update-${Date.now()}`,
        type: options.signatureType || 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        verificationMethod: `${did}#controllerKey`,
        proofPurpose: ProofPurpose.Authentication,
        proofValue: options.signature,
      });
    }
    const updatedDocument = documentBuilder.buildAndSeal();
    const domain = did.split(':')[2];
    try {
      await axios.post(`https://${domain}/.well-known/did.json`, updatedDocument);
    }  catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to save updated DID Document to domain: ${domain}, Reason : ${message}`,
      );
    }
    return updatedDocument;
  }

  /**
   * Deactivates a DID.
   * @param did - The DID to deactivate.
   * @param options - Method-specific options including publicKeyHex, signature, keyId, and signatureType.
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
    if (!didDocument) {
      throw new Error('Failed to resolve DID');
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
        .withAssertionMethod(didDocument.assertionMethod || []);
      if (didDocument.service) {
        documentBuilder.withServices(didDocument.service);
      }
      if (didDocument.keyAgreement) {
        documentBuilder.withKeyAgreement(didDocument.keyAgreement);
      }
      if (didDocument.linkedResource) {
        documentBuilder.withLinkedResources(didDocument.linkedResource);
      }
      documentBuilder.addProof({
        id: options.keyId || `${did}#deactivate-${Date.now()}`,
        type: options.signatureType || 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        verificationMethod: `${did}#controllerKey`,
        proofPurpose: ProofPurpose.Authentication,
        proofValue: options.signature,
      });
      const updatedDocument = documentBuilder.buildAndSeal();
      const domain = did.split(':')[2];
      try {
        await axios.post(`https://${domain}/.well-known/did.json`, updatedDocument);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Failed to save deactivated DID Document to domain: ${domain} Reason : ${message}`,
        );
      }
      return {
        didDocument: updatedDocument,
        metadata: updatedMetadata,
      };
    }
    return {
      didDocument: didDocument,
      metadata: updatedMetadata,
    };
  }
}
