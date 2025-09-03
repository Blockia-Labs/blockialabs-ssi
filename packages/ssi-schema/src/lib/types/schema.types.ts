export type SchemaStatus = 'ACTIVE' | 'DEPRECATED';

export interface JsonSchema {
  // Core vocabulary
  $id?: string;
  $schema?: string;
  $vocabulary?: Record<string, boolean>;
  $dynamicAnchor?: string;
  $dynamicRef?: string;
  $anchor?: string;
  $ref?: string;
  $comment?: string;

  // Validation vocabulary
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxContains?: number;
  minContains?: number;

  // Applicator vocabulary
  prefixItems?: JsonSchema[];
  items?: JsonSchema | JsonSchema[];
  contains?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  patternProperties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  propertyNames?: JsonSchema;

  // Metadata vocabulary
  title?: string;
  description?: string;
  default?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  examples?: unknown[];

  // Format vocabulary
  format?: string;

  // Conditional/Complex Subschema keywords
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;

  // Additional semantics
  required?: string[];
  $defs?: Record<string, JsonSchema>;
}

export interface Schema {
  id: string;
  name: string;
  schema: JsonSchema;
  metadata: SchemaMetadata;
  issuerId: string;
  status: SchemaStatus;
  createdAt: Date;
  updatedAt: Date;
  contentDigest?: {
    algorithm: 'sha256' | 'sha384' | 'sha512';
    value: string;
  };
}

export interface SchemaCreateRequest {
  name: string;
  schema: JsonSchema;
  metadata: SchemaMetadata;
  issuerId: string;
  contentDigest?: {
    algorithm: 'sha256' | 'sha384' | 'sha512';
    value: string;
  };
}

export interface SchemaUpdateRequest {
  name?: string;
  schema?: JsonSchema;
  metadata?: SchemaMetadata;
  status?: SchemaStatus;
}

export interface SchemaQueryOptions {
  issuerId?: string;
  status?: SchemaStatus;
}

export interface SchemaQuery {
  id?: string;
  name?: string;
  issuerId?: string;
  status?: SchemaStatus;
}

export type ValidationResult = {
  outcome: 'success' | 'failure' | 'indeterminate';
  errors?: string[];
  warnings?: string[];
};

export interface SchemaMetadata {
  cryptographicMethods?: string[];
  credentialSigningAlg?: string[];
  proofTypes?: Record<string, unknown>;
}
