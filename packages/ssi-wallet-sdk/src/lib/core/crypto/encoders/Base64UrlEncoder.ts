import { utf8ToBytes } from '@noble/hashes/utils.js';
import { BaseEncoder } from './BaseEncoder.js';

/**
 * Base64URL encoder following RFC 4648
 */
export class Base64UrlEncoder extends BaseEncoder {
  protected encode(bytes: Uint8Array): string {
    const base64 = Buffer.from(bytes).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  public encodeBytes(bytes: Uint8Array): string {
    return this.encode(bytes);
  }

  public encodeString(str: string): string {
    return this.encode(utf8ToBytes(str));
  }
}
