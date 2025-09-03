export class ValidationError extends Error {
  public readonly code: string;
  public readonly key?: string;
  public readonly value?: unknown;

  constructor(message: string, code: string, key?: string, value?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.key = key;
    this.value = value;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  static missingRequiredProperty(prop: string): ValidationError {
    return new ValidationError(
      `Missing required property: ${prop}`,
      'SCHEMA_MISSING_PROPERTY',
      prop,
    );
  }

  static invalidProperty(prop: string, message?: string): ValidationError {
    return new ValidationError(
      message || `Invalid property: ${prop}`,
      'SCHEMA_INVALID_PROPERTY',
      prop,
    );
  }

  static invalidPropertyType(
    prop: string,
    expectedType: string,
    actualType: string,
    value: unknown,
  ): ValidationError {
    return new ValidationError(
      `Invalid type for property '${prop}'. Expected ${expectedType}, but got ${actualType}.`,
      'SCHEMA_INVALID_TYPE',
      prop,
      value,
    );
  }

  static invalidPropertyValue(prop: string, value: unknown, message?: string): ValidationError {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return new ValidationError(
      message || `Invalid value for property '${prop}': ${stringValue}`,
      'SCHEMA_INVALID_VALUE',
      prop,
      value,
    );
  }

  static notAllowedAdditionalProperty(prop: string): ValidationError {
    return new ValidationError(
      `Additional property not allowed: ${prop}`,
      'SCHEMA_ADDITIONAL_PROPERTY_NOT_ALLOWED',
      prop,
    );
  }
}
