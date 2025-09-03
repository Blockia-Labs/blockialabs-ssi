export type DIDStatus = 'active' | 'deactivated' | 'revoked';

export interface DID {
  id: string;
  controller: string | string[];
  verificationMethod?: {
    id: string;
    type: string;
    controller: string;
    publicKeyJwk?: Record<string, unknown>;
    publicKeyMultibase?: string;
  }[];
  service?: {
    id: string;
    type: string;
    serviceEndpoint: string | Record<string, unknown>;
  }[];
  status: DIDStatus;
  metadata?: {
    created?: string;
    updated?: string;
    proof?: Record<string, unknown>;
    versionId?: string;
  };
  createdAt: number;
  updatedAt?: number;
}

export type DIDUpdateParams = Omit<Partial<DID>, 'id' | 'createdAt'>;
