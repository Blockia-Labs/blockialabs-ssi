import crypto from 'crypto';
import { JsonSchema } from '../types/schema.types.js';

export class SchemaIntegrity {
  static async verify(
    schema: JsonSchema,
    digest: { algorithm: string; value: string },
  ): Promise<boolean> {
    const expectedDigest = await this.calculateDigest(schema, digest.algorithm);
    return expectedDigest === digest.value;
  }

  static async calculateDigest(schema: JsonSchema, algorithm: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(schema));
    const hash = await crypto.subtle.digest(algorithm, data);

    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
