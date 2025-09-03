import { IDIDDocument } from '../../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentMetadata } from '../../interfaces/did-document/IDIDDocumentMetadata.js';

export interface IDIDMethod {
  /**
   * Creates a new DID and its DID Document.
   * @param options - Method-specific options including publicKeyHex, signature, and keyId.
   * @returns The DID and its DID Document.
   */
  create(options: {
    publicKeyHex: string;
    keyId?: string;
    signature?: string;
    signatureType?: string;
    [key: string]: unknown;
  }): Promise<{ did: string; didDocument: IDIDDocument }>;

  /**
   * Resolves a DID to its DID Document and metadata.
   * @param did - The DID to resolve.
   * @param options - Optional resolution parameters.
   * @returns The resolved DID Document and metadata.
   */
  resolve(
    did: string,
    options?: Record<string, unknown>,
  ): Promise<{ didDocument: IDIDDocument | null; metadata: IDIDDocumentMetadata }>;

  /**
   * Updates an existing DID Document.
   * @param did - The DID to update.
   * @param didDocument - The updated DID Document.
   * @param options - Method-specific options including publicKeyHex, signature, keyId, and signatureType.
   * @returns The updated DID Document.
   */
  update(
    did: string,
    didDocument: IDIDDocument,
    options: {
      publicKeyHex: string;
      signature?: string;
      keyId?: string;
      signatureType?: string;
      [key: string]: unknown;
    },
  ): Promise<IDIDDocument>;

  /**
   * Deactivates a DID.
   * @param did - The DID to deactivate.
   * @param options - Method-specific options including publicKeyHex, signature, keyId, and signatureType.
   * @returns The deactivated DID Document and metadata.
   */
  deactivate(
    did: string,
    options: {
      publicKeyHex: string;
      signature?: string;
      keyId?: string;
      signatureType?: string;
      [key: string]: unknown;
    },
  ): Promise<{ didDocument: IDIDDocument | null; metadata: IDIDDocumentMetadata }>;
}
