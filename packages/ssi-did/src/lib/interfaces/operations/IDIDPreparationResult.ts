import { IDIDDocumentBuilder } from '../did-document/IDIDDocumentBuilder.js';

/**
 * @interface IDIDPreparationResult
 * @description Interface defining the structure of the object returned by the prepareDid and prepareDidAsync methods.
 * The structure of this object is method-specific.
 */
export interface IDIDPreparationResult {
  did: string;
  didDocumentBuilder: IDIDDocumentBuilder;
  [key: string]: unknown;
}
