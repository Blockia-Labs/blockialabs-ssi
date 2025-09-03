export interface JwtHeader {
  readonly alg: 'secp256k1';
  readonly typ: 'openid4vci-proof+jwt';
  readonly kid: string;
}

export interface JwtPayload {
  readonly iss: string;
  readonly aud: string;
  readonly iat: number;
  readonly nonce: string;
}

export interface ProofParams {
  privateKey: string;
  holderDid: string;
  issuerDid: string;
  nonce: string;
}
