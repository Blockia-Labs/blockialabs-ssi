import { HDKey } from '@scure/bip32';
import { base64url } from '@scure/base';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ValidationError, CryptographyError } from '../../utils/errors.js';
import { ENTROPY_SIZES } from '../../utils/constants.js';
import { JsonWebKey } from '../../types/index.js';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';

export class CryptoUtils {
  static generateMnemonic(entropySize = 256): string {
    if (!ENTROPY_SIZES.includes(entropySize)) {
      throw new ValidationError('Invalid entropy size');
    }

    try {
      return generateMnemonic(wordlist, entropySize);
    } catch {
      throw new CryptographyError('Mnemonic generation failed');
    }
  }

  static validateMnemonic(mnemonic: string): boolean {
    try {
      return validateMnemonic(mnemonic, wordlist);
    } catch {
      return false;
    }
  }

  static async mnemonicToSeed(mnemonic: string, passphrase?: string): Promise<Uint8Array> {
    try {
      return await mnemonicToSeed(mnemonic, passphrase);
    } catch {
      throw new CryptographyError('Seed conversion failed');
    }
  }

  static createMasterKey(seed: Uint8Array): HDKey {
    try {
      return HDKey.fromMasterSeed(seed);
    } catch {
      throw new CryptographyError('Master key creation failed');
    }
  }

  static deriveChildKey(masterKey: HDKey, derivationPath: string, accountIndex: number): HDKey {
    try {
      const fullPath = `${derivationPath}/${accountIndex}`;
      const childKey = masterKey.derive(fullPath);

      if (!childKey.privateKey || !childKey.publicKey) {
        throw new CryptographyError('Key derivation incomplete');
      }

      return childKey;
    } catch {
      throw new CryptographyError('Child key derivation failed');
    }
  }

  static hashMessage(message: string): Uint8Array {
    try {
      const messageBytes = utf8ToBytes(message);
      return sha256(messageBytes);
    } catch {
      throw new CryptographyError('Message hashing failed');
    }
  }

  static signMessage(privateKey: Uint8Array, message: string): string {
    try {
      const messageHash = this.hashMessage(message);
      const signature = secp256k1.sign(messageHash, privateKey);
      const signatureBytes = signature;
      return base64url.encode(signatureBytes);
    } catch {
      throw new CryptographyError('Message signing failed');
    }
  }

  static verifyMessage(
    publicKey: Uint8Array,
    message: string,
    signatureBase64url: string,
  ): boolean {
    try {
      const messageHash = this.hashMessage(message);
      const signatureBytes = base64url.decode(signatureBase64url);
      return secp256k1.verify(signatureBytes, messageHash, publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Generate a DID-compatible key identifier from public key
   */
  static generateKeyId(publicKey: Uint8Array): string {
    try {
      const hash = sha256(publicKey);
      return base64url.encode(hash.slice(0, 16)); // Use first 16 bytes as key ID
    } catch {
      throw new CryptographyError('Key ID generation failed');
    }
  }

  /**
   * Convert public key to JWK format for DID documents
   */
  static publicKeyToJWK(publicKey: Uint8Array): JsonWebKey {
    try {
      // Extract x and y coordinates from uncompressed public key
      const publicKeyHex = bytesToHex(publicKey);
      const uncompressed = secp256k1.Point.fromHex(publicKeyHex).toBytes(false);
      const x = uncompressed.slice(1, 33);
      const y = uncompressed.slice(33, 65);

      return {
        kty: 'EC',
        crv: 'secp256k1',
        x: base64url.encode(x),
        y: base64url.encode(y),
      };
    } catch {
      throw new CryptographyError('JWK conversion failed');
    }
  }

  /**
   * Generate DID:key identifier from public key
   */
  static publicKeyToDidKey(publicKey: Uint8Array): string {
    try {
      // Multicodec prefix for secp256k1 public key (0xe7, 0x01)
      const multicodecPrefix = new Uint8Array([0xe7, 0x01]);
      const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKey.length);
      multicodecKey.set(multicodecPrefix);
      multicodecKey.set(publicKey, multicodecPrefix.length);

      return `did:key:z${base64url.encode(multicodecKey)}`;
    } catch {
      throw new CryptographyError('DID:key generation failed');
    }
  }

  /**
   * Create JWT key proof for OpenID4VCI credential requests
   */
  static createJwtKeyProof(
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    audience: string,
    nonce?: string,
  ): string {
    try {
      const header = {
        typ: 'openid4vci-proof+jwt',
        alg: 'ES256K',
        jwk: this.publicKeyToJWK(publicKey),
      };

      const payload = {
        aud: audience,
        iat: Math.floor(Date.now() / 1000),
        ...(nonce && { nonce }),
      };

      const headerB64 = base64url.encode(utf8ToBytes(JSON.stringify(header)));
      const payloadB64 = base64url.encode(utf8ToBytes(JSON.stringify(payload)));
      const message = `${headerB64}.${payloadB64}`;

      const signature = this.signMessage(privateKey, message);
      return `${message}.${signature}`;
    } catch {
      throw new CryptographyError('JWT key proof creation failed');
    }
  }
}
