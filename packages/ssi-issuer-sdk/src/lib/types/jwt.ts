export interface JWTHeader {
  typ: string;
  alg: 'ES256' | string;
  jwk?: {
    kty: string;
    crv: string;
    x: string;
  };
  kid?: string;
}

export interface JWTPayload {
  iat?: number;
  nonce?: string;
  aud?: string;
  [key: string]: unknown;
}
