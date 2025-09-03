import { ValidationError } from '../errors/ValidationError.js';
import { ICredentialSchema } from '../interfaces/ICredentialSchema.js';
import { ICredentialSubject } from '../types/index.js';

export class CredentialSchema {
  readonly schema: ICredentialSchema;

  constructor(schema: ICredentialSchema) {
    this.validateSchema(schema);
    this.schema = schema;
  }

  private validateSchema(schema: ICredentialSchema): void {
    if (!schema.$id || !schema.type || !schema.properties) {
      throw new Error('Invalid schema structure');
    }
  }

  public validate(data: ICredentialSubject | ICredentialSubject[]): boolean {
    if (Array.isArray(data)) {
      for (const item of data) {
        this.validateSingleSubject(item);
      }
      return true;
    } else {
      return this.validateSingleSubject(data);
    }
  }

  private validateSingleSubject(data: ICredentialSubject): boolean {
    if (!this.schema.required) return true;

    for (const required of this.schema.required) {
      if (!(required in data)) {
        throw ValidationError.missingRequiredProperty(required);
      }
    }

    for (const [key, value] of Object.entries(data)) {
      const propertySchema = this.schema.properties[key];
      if (!propertySchema && !this.schema.additionalProperties) {
        throw ValidationError.notAllowedAdditionalProperty(key);
      }
      if (propertySchema && propertySchema.type) {
        const expectedType = propertySchema.type;
        const actualType = typeof value;
        if (!this.validateType(value, expectedType)) {
          throw ValidationError.invalidPropertyType(key, expectedType, actualType, value);
        }
      }
    }

    return true;
  }

  private validateType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }
}
