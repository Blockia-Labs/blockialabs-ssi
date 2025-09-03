import { ISchemaStorage } from '../interfaces/ISchemaStorage.js';
import { SchemaSdk } from '../SchemaSdk.js';
import { Schema, SchemaCreateRequest, SchemaUpdateRequest } from '../types/schema.types.js';
import { SchemaValidator } from '../validation/SchemaValidator.js';

describe('SchemaSdk', () => {
  let sdk: SchemaSdk;
  let mockStorage: jest.Mocked<ISchemaStorage>;
  let mockValidator: jest.Mocked<SchemaValidator>;

  const testSchema: Schema = {
    id: 'test-id',
    name: 'Test Schema',
    schema: {
      $id: 'test',
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        credentialSubject: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uri',
              description: 'Subject identifier',
            },
            alumniOf: {
              type: 'array',
              items: {
                type: 'string',
                description: 'Organization IDs',
              },
              minItems: 1,
            },
            degree: {
              type: 'string',
              enum: ['BSc', 'MSc', 'PhD'],
            },
          },
          required: ['id'],
          additionalProperties: false,
        },
        issuer: {
          type: 'string',
          format: 'uri',
          description: 'Issuer DID',
        },
        issuanceDate: {
          type: 'string',
          format: 'date-time',
        },
        proof: {
          $ref: '#/$defs/proof',
        },
      },
      required: ['credentialSubject', 'issuer', 'issuanceDate'],
      $defs: {
        proof: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            created: { type: 'string', format: 'date-time' },
            verificationMethod: { type: 'string' },
            proofPurpose: { type: 'string' },
          },
          required: ['type', 'created'],
        },
      },
    },
    metadata: {},
    issuerId: 'issuer-1',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockStorage = {
      create: jest.fn().mockResolvedValue(testSchema),
      findMany: jest.fn().mockResolvedValue([testSchema]),
      findOne: jest.fn().mockResolvedValue(testSchema),
      update: jest.fn().mockResolvedValue(testSchema),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    mockValidator = {
      validateSchemaStructure: jest.fn().mockReturnValue({ outcome: 'success' }),
      calculateDigest: jest.fn().mockResolvedValue('mock-digest'),
    } as unknown as jest.Mocked<SchemaValidator>;

    sdk = new SchemaSdk(mockStorage, mockValidator);
  });

  describe('createSchema', () => {
    const createRequest: SchemaCreateRequest = {
      name: 'Test Schema',
      schema: testSchema.schema,
      metadata: {},
      issuerId: 'issuer-1',
    };

    it('should create schema when validation passes', async () => {
      const result = await sdk.createSchema(createRequest);
      expect(result).toEqual(testSchema);
      expect(mockValidator.validateSchemaStructure).toHaveBeenCalledWith(createRequest.schema);
      expect(mockStorage.create).toHaveBeenCalled();
    });

    it('should throw error when validation fails', async () => {
      mockValidator.validateSchemaStructure.mockReturnValueOnce({
        outcome: 'failure',
        errors: ['Test error'],
      });

      await expect(sdk.createSchema(createRequest)).rejects.toThrow('Invalid schema: Test error');
    });

    it('should include content digest in creation', async () => {
      await sdk.createSchema(createRequest);
      expect(mockStorage.create).toHaveBeenCalledWith({
        ...createRequest,
        contentDigest: {
          algorithm: 'sha384',
          value: 'mock-digest',
        },
      });
    });
  });

  describe('getSchemas', () => {
    it('should return schemas from storage', async () => {
      const result = await sdk.findSchemas();
      expect(result).toEqual([testSchema]);
      expect(mockStorage.findMany).toHaveBeenCalled();
    });

    it('should pass query options to storage', async () => {
      const options = { issuerId: 'issuer-1' };
      await sdk.findSchemas(options);
      expect(mockStorage.findMany).toHaveBeenCalledWith(options);
    });
  });

  describe('getSchemaById', () => {
    it('should return schema from cache if available', async () => {
      // Populate cache
      await sdk.findSchemaById('test-id');

      // Should use cache now
      mockStorage.findOne.mockClear();
      const result = await sdk.findSchemaById('test-id');
      expect(result).toEqual(testSchema);
      expect(mockStorage.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from storage when skipCache is true', async () => {
      await sdk.findSchemaById('test-id', true);
      expect(mockStorage.findOne).toHaveBeenCalled();
    });

    it('should throw error when schema not found', async () => {
      mockStorage.findOne.mockResolvedValueOnce(null);
      await expect(sdk.findSchemaById('non-existent')).rejects.toThrow(
        'Schema not found: non-existent',
      );
    });
  });

  describe('updateSchema', () => {
    const updateRequest: SchemaUpdateRequest = {
      name: 'Updated Name',
      schema: testSchema.schema,
    };

    it('should update schema when validation passes', async () => {
      const result = await sdk.updateSchema('test-id', updateRequest);
      expect(result).toEqual(testSchema);
      expect(mockValidator.validateSchemaStructure).toHaveBeenCalledWith(updateRequest.schema);
      expect(mockStorage.update).toHaveBeenCalled();
    });

    it('should throw error when validation fails', async () => {
      mockValidator.validateSchemaStructure.mockReturnValueOnce({
        outcome: 'failure',
        errors: ['Test error'],
      });

      await expect(sdk.updateSchema('test-id', { schema: testSchema.schema })).rejects.toThrow(
        'Invalid schema: Test error',
      );
    });

    it('should allow partial updates without schema', async () => {
      await sdk.updateSchema('test-id', { name: 'New Name' });
      expect(mockValidator.validateSchemaStructure).not.toHaveBeenCalled();
      expect(mockStorage.update).toHaveBeenCalledWith('test-id', { name: 'New Name' });
    });
  });

  describe('deprecateSchema', () => {
    it('should update status to DEPRECATED', async () => {
      await sdk.deprecateSchema('test-id');
      expect(mockStorage.update).toHaveBeenCalledWith('test-id', { status: 'DEPRECATED' });
    });
  });

  describe('deleteSchema', () => {
    it('should delete schema from storage', async () => {
      await sdk.deleteSchema('test-id');
      expect(mockStorage.delete).toHaveBeenCalledWith('test-id');
    });
  });
});
