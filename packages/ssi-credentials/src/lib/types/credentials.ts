import { Context } from './base.js';
import { IProof } from './proof.js';

export enum CredentialFormatType {
  JSON_LD = 'ldp_vc',
  JWT_VC = 'jwt_vc',
  JWT_VC_JSON = 'jwt_vc_json',
  JWT_VC_JSON_LD = 'jwt_vc_json-ld',
  SD_JWT_VC = 'sd_jwt_vc',
  VC_SD_JWT = 'vc+sd-jwt',
}

export type CredentialStatus = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export type CredentialSchema = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export type Evidence = {
  id?: string;
  type: string[];
  [key: string]: unknown;
};

export type TermsOfUse = {
  type: string;
  [key: string]: unknown;
};

export type RefreshService = {
  id: string;
  type: string;
  [key: string]: unknown;
};

export interface ICredentialSubject {
  id?: string;
  [key: string]: unknown;
}

export interface ICredential {
  '@context': Context[];
  'id': string;
  'type': string[];
  'name': string;
  'description': string;
  'issuer': string | { id: string; [key: string]: unknown };
  'validFrom': string;
  'validUntil'?: string;
  'credentialSubject': ICredentialSubject;
  'credentialStatus'?: CredentialStatus;
  'credentialSchema': CredentialSchema;
  'evidence'?: Evidence[];
  'termsOfUse'?: TermsOfUse[];
  'refreshService'?: RefreshService;
  'proof'?: IProof | IProof[];
}
