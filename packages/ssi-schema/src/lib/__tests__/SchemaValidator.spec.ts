import { JsonSchema, ValidationResult } from '../types/schema.types.js';
import { SchemaValidator } from '../validation/SchemaValidator.js';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  describe('validateSchemaStructure', () => {
    const validSchema: JsonSchema = {
      $id: 'https://example.com/schema.json',
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        credentialSubject: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uri',
            },
            name: {
              type: 'string',
              minLength: 1,
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
          required: ['id'],
          additionalProperties: false,
        },
        issuanceDate: {
          type: 'string',
          format: 'date-time',
        },
      },
      required: ['credentialSubject'],
    };

    it('should return success for valid schema', () => {
      const result: ValidationResult = validator.validateSchemaStructure(validSchema);
      expect(result.outcome).toBe('success');
      expect(result.errors).toBeUndefined();
    });

    it('should fail when required fields are missing', () => {
      const invalidSchema = { ...validSchema };
      delete invalidSchema.$id;
      delete invalidSchema.type;
      const result: ValidationResult = validator.validateSchemaStructure(invalidSchema);
      expect(result.outcome).toBe('failure');
      expect(result.errors).toContain('Missing required properties: $id, type');
    });

    it('should return indeterminate for unsupported schema version', () => {
      const result: ValidationResult = validator.validateSchemaStructure({
        ...validSchema,
        $schema: 'unsupported-version' as never,
      });
      expect(result.outcome).toBe('indeterminate');
      expect(result.errors).toContain('Unsupported schema version: unsupported-version');
    });
  });

  describe('calculateDigest', () => {
    it('should return a SHA-384 hash string', async () => {
      const schema: JsonSchema = {
        $id: 'test',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          credentialSubject: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        },
      };
      const digest = await validator.calculateDigest(schema);
      expect(typeof digest).toBe('string');
      expect(digest).toMatch(/^[a-f0-9]{96}$/); // SHA-384 produces 96-character hex string
    });
  });
});
