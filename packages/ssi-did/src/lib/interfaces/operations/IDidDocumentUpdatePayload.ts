import { IDidDocumentUpdateOperations } from './IDidDocumentUpdateOperations.js';

/**
 * Interface for DID document update payload
 */
export interface IDidDocumentUpdatePayload {
  did: string;
  previousDocumentId: string;
  operations: IDidDocumentUpdateOperations;
  timestamp: number;
}
