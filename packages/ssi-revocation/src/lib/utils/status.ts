import * as zlib from 'zlib';
import { StatusPurpose } from '../interfaces/enums.js';
import { BitstringStatusListCredential, CredentialSubject } from '../interfaces/types.js';

export class Status {
  // Default size for bitstring (16KB = 131,072 bits)
  private static readonly DEFAULT_LIST_SIZE = 131072;

  /**
   * Generate a status list bitstring according to the W3C Bitstring Generation Algorithm
   *
   * @param issuedCredentials List of credentials that reference this status list
   * @param statusSize Size of the status entry (defaults to 1)
   * @returns Multibase-encoded compressed bitstring
   */
  public static generateStatusListBitstring(
    issuedCredentials: Array<{ credentialStatus?: { statusListIndex?: string } }> = [],
    statusSize = 1,
  ): string {
    const bitstring = Buffer.alloc(this.DEFAULT_LIST_SIZE / 8, 0);

    for (const credential of issuedCredentials) {
      const statusIndex = credential?.credentialStatus?.statusListIndex;
      if (statusIndex) {
        const indexNum = parseInt(statusIndex);

        const position = indexNum * statusSize;

        if (position >= 0 && position < bitstring.length * 8) {
          const byteIndex = Math.floor(position / 8);
          const bitPosition = 7 - (position % 8); // Most significant bit first

          bitstring[byteIndex] |= 1 << bitPosition;
        }
      }
    }

    const compressed = zlib.gzipSync(bitstring);
    return 'u' + compressed.toString('base64url');
  }

  /**
   * Create a new status list following the W3C Bitstring Generation Algorithm
   *
   * @param statusPurpose The purpose of the status list (e.g., revocation)
   * @param issuedCredentials List of credentials that reference this status list
   * @returns BitstringStatusListCredential without proof
   */
  public static createStatusList(
    issuedCredentials: Array<{ credentialStatus?: { statusListIndex?: string } }> = [],
    statusSize = 1,
    credentialSubject: Partial<CredentialSubject>,
  ): BitstringStatusListCredential {
    const encodedList = this.generateStatusListBitstring(issuedCredentials, statusSize);
    const statusPurpose = credentialSubject.statusPurpose || StatusPurpose.REVOCATION;

    return {
      id: crypto.randomUUID(),
      type: 'BitstringStatusListCredential',
      credentialSubject: {
        type: 'BitstringStatusList',
        statusPurpose,
        encodedList,
      },
    };
  }

  /**
   * Expand a compressed bitstring following the W3C Bitstring Expansion Algorithm
   *
   * @param compressedBitstring Multibase-encoded compressed bitstring
   * @returns Uncompressed bitstring as Buffer
   */
  public static expandBitstring(compressedBitstring: string): Buffer {
    try {
      if (!compressedBitstring || !compressedBitstring.startsWith('u')) {
        throw new Error('Invalid compressed bitstring: missing "u" prefix');
      }

      const base64Content = compressedBitstring.slice(1);
      const compressed = Buffer.from(base64Content, 'base64url');

      const uncompressedBitstring = zlib.gunzipSync(compressed);

      return uncompressedBitstring;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to expand bitstring: ${error.message}`);
      }
      throw new Error('Failed to expand bitstring due to unknown error');
    }
  }
}
