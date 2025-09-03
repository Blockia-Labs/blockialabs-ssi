import crypto from 'crypto';
import { DraftRegistry } from '../registry/DraftRegistry.js';
import { JsonSchema, ValidationResult } from '../types/schema.types.js';

export class SchemaValidator {
  constructor(private draftRegistry = new DraftRegistry()) {}

  validateSchemaStructure(schema: JsonSchema): ValidationResult {
    if (!this.draftRegistry.isSupportedDraft(schema.$schema)) {
      return {
        outcome: 'indeterminate',
        errors: [`Unsupported schema version: ${schema.$schema}`],
        warnings: [`Unsupported or unspecified schema version: ${schema.$schema}`],
      };
    }

    const required = ['$id', '$schema', 'type', 'properties'];
    const missing = required.filter((field) => !(field in schema));

    if (missing.length > 0) {
      return {
        outcome: 'failure',
        errors: [`Missing required properties: ${missing.join(', ')}`],
      };
    }

    return { outcome: 'success' };
  }

  async calculateDigest(schema: JsonSchema): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(schema));
    const hash = await crypto.subtle.digest('SHA-384', data);

    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
