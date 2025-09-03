import { Extensible } from './IExtensible.js';

export interface IDIDDocumentMetadata extends Extensible {
  created?: string;
  updated?: string;
  deactivated?: boolean;
  versionId?: string;
  equivalentId?: string[];
  canonicalId?: string;
  [property: string]: unknown;
}
