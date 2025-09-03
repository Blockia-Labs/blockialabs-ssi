import { IDIDPreparationResult } from './IDIDPreparationResult.js';
import { IDidDocumentUpdatePayload } from './IDidDocumentUpdatePayload.js';

export interface IDIDUpdatePreparationResult extends IDIDPreparationResult {
  updatePayload: IDidDocumentUpdatePayload;
}
