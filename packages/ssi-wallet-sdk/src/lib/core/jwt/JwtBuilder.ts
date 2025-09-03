import { JwtHeader, JwtPayload } from '../../types/index.js';
import { Base64UrlEncoder } from '../crypto/encoders/Base64UrlEncoder.js';

/**
 * JWT token builder
 */
export class JwtBuilder {
  constructor(private readonly encoder: Base64UrlEncoder) {}

  public buildToken(header: JwtHeader, payload: JwtPayload, signature: Uint8Array): string {
    const headerB64 = this.encoder.encodeString(JSON.stringify(header));
    const payloadB64 = this.encoder.encodeString(JSON.stringify(payload));
    const signatureB64 = this.encoder.encodeBytes(signature);

    return `${headerB64}.${payloadB64}.${signatureB64}`;
  }

  public buildSigningMessage(header: JwtHeader, payload: JwtPayload): string {
    const headerB64 = this.encoder.encodeString(JSON.stringify(header));
    const payloadB64 = this.encoder.encodeString(JSON.stringify(payload));

    return `${headerB64}.${payloadB64}`;
  }
}
