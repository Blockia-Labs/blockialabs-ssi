import { base64url } from '@scure/base';
import { JWK, KeyType } from '@blockialabs/ssi-types';

export class Key {
  constructor(
    public readonly publicKey: Uint8Array,
    public readonly privateKey: Uint8Array,
    public readonly type: KeyType,
  ) {}

  get kid(): string {
    return this.fingerprint();
  }

  static fromJWK(jwk: JWK): Key {
    if (!jwk.x) {
      throw new Error('JWK is missing required property "x"');
    }

    const publicKey = base64url.decode(jwk.x);
    const privateKey = jwk.d ? base64url.decode(jwk.d) : new Uint8Array(0);

    if (jwk.crv === 'Ed25519') {
      return new Key(publicKey, privateKey, 'Ed25519');
    }

    if (jwk.crv === 'secp256k1') {
      return new Key(publicKey, privateKey, 'Secp256k1');
    }

    throw new Error(`Unsupported curve: ${jwk.crv}`);
  }

  toJWK(): JWK {
    const kid = base64url.encode(this.publicKey);
    const x = base64url.encode(this.publicKey);
    const d = this.privateKey.length > 0 ? base64url.encode(this.privateKey) : undefined;

    if (this.type === 'Ed25519') {
      return {
        kid,
        kty: 'OKP',
        crv: 'Ed25519',
        x,
        d,
      };
    }

    if (this.type === 'Secp256k1') {
      return {
        kid,
        kty: 'EC',
        crv: 'secp256k1',
        x: base64url.encode(this.publicKey.slice(1, 33)),
        y: base64url.encode(this.publicKey.slice(33, 65)),
        d,
      };
    }

    throw new Error(`Unsupported key type: ${this.type}`);
  }

  validate(): void {
    this.validateKeyType();
    this.validateKeyLengths();
  }

  // Utility methods
  hasPrivateKey(): boolean {
    return this.privateKey.length > 0;
  }

  equals(other: Key): boolean {
    return (
      this.type === other.type &&
      Buffer.from(this.publicKey).equals(Buffer.from(other.publicKey)) &&
      Buffer.from(this.privateKey).equals(Buffer.from(other.privateKey))
    );
  }

  clone(): Key {
    return new Key(new Uint8Array(this.publicKey), new Uint8Array(this.privateKey), this.type);
  }

  fingerprint(): string {
    return base64url.encode(this.publicKey);
  }

  // Validation methods
  private validateKeyType(): void {
    if (this.type !== 'Ed25519' && this.type !== 'Secp256k1') {
      throw new Error(`Invalid key type: ${this.type}`);
    }
  }

  private validateKeyLengths(): void {
    const pubKeyLength = this.type === 'Ed25519' ? 32 : 65;
    if (this.publicKey.length !== pubKeyLength) {
      throw new Error(`${this.type} public key must be ${pubKeyLength} bytes`);
    }

    if (this.privateKey.length > 0) {
      const privKeyLength = 32;
      if (this.privateKey.length !== privKeyLength) {
        throw new Error(`${this.type} private key must be ${privKeyLength} bytes`);
      }
    }
  }
}
