import { IService } from '@blockialabs/ssi-did';

/**
 * Options for preparing a DID:key.
 */
export interface KeyDIDPrepareOptions {
  publicKey: Uint8Array;
  keyType?: string;
  parameters?: Record<string, string>;
  fragment?: string;
  context?: string | string[];
  alsoKnownAs?: string[];
  controller?: string | string[];
  services?: IService[];
  additionalProperties?: Record<string, unknown>;
}
