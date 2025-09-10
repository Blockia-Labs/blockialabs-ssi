import { SchemaService } from '../services/SchemaService.js';
import {
  Context,
  CredentialSchema,
  CredentialStatus,
  Evidence,
  ICredential,
  ICredentialSubject,
  IProof,
  RefreshService,
  TermsOfUse,
} from '../types/index.js';

export class Credential implements ICredential {
  '@context': Context[] = ['https://www.w3.org/2018/credentials/v1'];
  'id' = '';
  'type': string[] = ['VerifiableCredential'];
  'issuer': string | { id: string; [key: string]: unknown } = '';
  'name' = '';
  'description' = '';
  'validFrom' = new Date().toISOString();
  'validUntil'?: string;
  'credentialSubject': ICredentialSubject = {};
  'credentialStatus'?: CredentialStatus;
  'credentialSchema': CredentialSchema = {} as CredentialSchema;
  'proof'?: IProof | IProof[];
  'evidence'?: Evidence[];
  'termsOfUse'?: TermsOfUse[];
  'refreshService'?: RefreshService;

  'constructor'(
    params: Partial<ICredential>,
    private schemaService?: SchemaService,
  ) {
    this['@context'] = params['@context'] || this['@context'];
    this.id = params.id || this.id;
    this.type = params.type || this.type;
    this.issuer = params.issuer || this.issuer;
    this.name = params.name || this.name;
    this.description = params.description || this.description;
    this.validFrom = params.validFrom || this.validFrom;
    this.validUntil = params.validUntil;
    this.credentialSubject = params.credentialSubject || this.credentialSubject;
    this.credentialStatus = params.credentialStatus;
    this.credentialSchema = params.credentialSchema || this.credentialSchema;
    this.evidence = params.evidence;
    this.termsOfUse = params.termsOfUse;
    this.refreshService = params.refreshService;
    this.proof = params.proof;

    if (this.schemaService) {
      this.schemaService.validateCredential(this);
    }
  }

  'isValid'(): boolean {
    return (
      !!this.id &&
      this.type.length > 0 &&
      !!this.issuer &&
      !!this.validFrom &&
      !!this.name &&
      !!this.description &&
      !!this.credentialSubject &&
      !!this.credentialSchema
    );
  }
}
