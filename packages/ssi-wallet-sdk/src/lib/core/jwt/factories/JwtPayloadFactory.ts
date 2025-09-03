import { JwtPayload } from '../../../types/index.js';

/**
 * JWT payload factory
 */
export class JwtPayloadFactory {
  public createPayload(holderDid: string, issuerDid: string, nonce: string): JwtPayload {
    return {
      iss: holderDid,
      aud: issuerDid,
      iat: Math.floor(Date.now() / 1000),
      nonce,
    };
  }
}
