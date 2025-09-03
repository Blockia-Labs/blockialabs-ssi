import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';

/**
 * Calculate hash of content
 */
export function hashContent(
  content: string | Record<string, unknown>,
  hashMethod = 'sha256',
): { hash: string; hashMethod: string } {
  const contentString = typeof content === 'object' ? stringify(content) : content;
  if (contentString === undefined) {
    throw new Error('Content cannot be undefined');
  }
  const hash = crypto.createHash(hashMethod).update(contentString).digest('hex');
  return { hash, hashMethod };
}

/**
 * Check if content matches an expected hash
 */
export function checkHash(
  hash: string,
  hashMethod: string,
  content: string | Record<string, unknown>,
): boolean {
  const contentString = typeof content === 'object' ? stringify(content) : content;
  if (contentString === undefined) {
    throw new Error('Content cannot be undefined');
  }
  const { hash: computedHash } = hashContent(contentString, hashMethod);
  return hash === computedHash;
}
