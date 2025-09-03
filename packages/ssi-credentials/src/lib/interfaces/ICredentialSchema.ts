/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ICredentialSchema {
  $id: string;
  $schema?: string;
  type: 'JsonSchema';
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}
