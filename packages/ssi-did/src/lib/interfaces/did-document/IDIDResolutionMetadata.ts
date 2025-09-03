import { Extensible } from './IExtensible.js';

export interface IDIDResolutionOptions extends Extensible {
  accept?: string;
}

export interface IDIDResolutionMetadata extends Extensible {
  contentType?: string;
  error?: string;
  [property: string]: unknown;
}
