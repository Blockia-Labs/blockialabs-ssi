import { JwtHeader } from '../../../types/index.js';

/**
 * JWT header factory
 */
export class JwtHeaderFactory {
  public createHeader(holderDid: string): JwtHeader {
    return {
      alg: 'secp256k1',
      typ: 'openid4vci-proof+jwt',
      kid: `${holderDid}#controllerKey`,
    };
  }
}
