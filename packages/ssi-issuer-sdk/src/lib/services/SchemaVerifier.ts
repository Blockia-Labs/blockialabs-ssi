import { ISchemaVerifier, ICredential } from '@blockialabs/ssi-credentials';

/**
 * Schema validator that performs basic validation
 */
export class SchemaVerifier implements ISchemaVerifier {
  async validate<T extends object>(content: T, schemaId: string): Promise<T> {
    // Check for required credential fields
    const credential = content as unknown as ICredential;

    if (!credential['@context']?.includes('https://www.w3.org/2018/credentials/v1')) {
      throw new Error('Credential missing required @context');
    }

    if (!credential.type?.includes('VerifiableCredential')) {
      throw new Error('Credential missing required type VerifiableCredential');
    }

    if (!credential.issuer) {
      throw new Error('Credential missing issuer');
    }

    if (!credential.credentialSubject) {
      throw new Error('Credential missing credentialSubject');
    }

    return content;
  }
}
