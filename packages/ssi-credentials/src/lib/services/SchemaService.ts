import { ICredentialSchema } from '../interfaces/ICredentialSchema.js';
import { ISchemaVerifier } from '../interfaces/providers.js';
import { CredentialSchema } from '../models/CredentialSchema.js';
import { ICredential } from '../types/index.js';

export class SchemaService implements ISchemaVerifier {
  private schemas: Map<string, CredentialSchema> = new Map();

  public registerSchema(schema: ICredentialSchema): void {
    this.schemas.set(schema.$id, new CredentialSchema(schema));
  }

  public validateCredential(credential: ICredential): boolean {
    if (!credential.credentialSchema) {
      return true;
    }

    const schemas = Array.isArray(credential.credentialSchema)
      ? credential.credentialSchema
      : [credential.credentialSchema];

    for (const schemaRef of schemas) {
      const schema = this.schemas.get(schemaRef.id);
      if (!schema) {
        throw new Error(`Schema not found: ${schemaRef.id}`);
      }
      schema.validate(credential.credentialSubject);
    }

    return true;
  }

  public async validate<T>(content: T, schemaId: string): Promise<T> {
    const schema = this.schemas.get(schemaId);
    if (!schema) {
      throw new Error(`Schema not found: ${schemaId}`);
    }

    schema.validate((content as ICredential).credentialSubject);
    return content;
  }
}
