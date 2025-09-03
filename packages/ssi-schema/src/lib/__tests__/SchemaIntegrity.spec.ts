import { JsonSchema } from '../types/schema.types.js';
import { SchemaIntegrity } from '../validation/SchemaIntegrity.js';

describe('SchemaIntegrity', () => {
  const testSchema: JsonSchema = {
    $id: 'test',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      credentialSubject: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the subject',
            minLength: 1,
          },
        },
        required: ['name'],
        additionalProperties: false,
      },
      issuanceDate: {
        type: 'string',
        format: 'date-time',
      },
    },
  };

  it('should verify correct digest', async () => {
    const algorithm = 'SHA-256';
    const expectedDigest = await SchemaIntegrity.calculateDigest(testSchema, algorithm);
    const result = await SchemaIntegrity.verify(testSchema, {
      algorithm,
      value: expectedDigest,
    });
    expect(result).toBe(true);
  });

  it('should reject incorrect digest', async () => {
    const result = await SchemaIntegrity.verify(testSchema, {
      algorithm: 'SHA-256',
      value: 'incorrect-digest',
    });
    expect(result).toBe(false);
  });

  it('should work with different algorithms', async () => {
    const algorithms = ['SHA-256', 'SHA-384', 'SHA-512'] as const;
    for (const algorithm of algorithms) {
      const expectedDigest = await SchemaIntegrity.calculateDigest(testSchema, algorithm);
      const result = await SchemaIntegrity.verify(testSchema, {
        algorithm,
        value: expectedDigest,
      });
      expect(result).toBe(true);
    }
  });
});
