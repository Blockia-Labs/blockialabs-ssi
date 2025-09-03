import { IService } from '../did-document/IService.js';
import { IVerificationMethod } from '../did-document/IVerificationMethod.js';

/**
 * Interface for DID document update operations
 */
export interface IDidDocumentUpdateOperations {
  addService?: IService[];
  removeService?: string[];

  addVerificationMethod?: IVerificationMethod[];
  removeVerificationMethod?: string[];

  rotateControllerKey?: boolean;
  newControllerKey?: string;
}
