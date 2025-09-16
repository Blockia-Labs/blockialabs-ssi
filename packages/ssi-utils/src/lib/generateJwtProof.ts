import { base64url } from '@scure/base';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { utf8ToBytes, hexToBytes } from '@noble/hashes/utils.js';

export async function generateJwtProof(
  privateKey: string,
  holderDid: string,
  issuerDid: string,
  nonce: string,
): Promise<string> {
  // TODO: Support other algorithms and key types
  // For now, we assume ES256K and a secp256k1 private key in hex format
  const header = {
    alg: 'ES256',
    typ: 'openid4vci-proof+jwt',
    kid: `${holderDid}#controllerKey`,
  };

  const payload = {
    iss: holderDid,
    aud: issuerDid,
    iat: Math.floor(Date.now() / 1000),
    nonce,
  };

  const headerB64Url = base64url.encode(utf8ToBytes(JSON.stringify(header)));
  const payloadB64Url = base64url.encode(utf8ToBytes(JSON.stringify(payload)));

  const message = `${headerB64Url}.${payloadB64Url}`;
  const messageBytes = utf8ToBytes(message); // utf8ToBytes not sha256(messageBytes);

  const privateKeyBytes = hexToBytes(privateKey);

  // TODO: Hash the message if needed, instead of passing the raw bytes
  // verify supports both hashed and non-hashed messages via options skipHashing
  const signature = secp256k1.sign(messageBytes, privateKeyBytes);
  const signatureB64Url = base64url.encode(signature.toBytes('compact'));

  return `${message}.${signatureB64Url}`;
}
