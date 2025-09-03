import { ICredential } from '@blockialabs/ssi-credentials';

/**
 * Interface for the verifiable credential repository
 */
export interface IVCRepository {
  create(params: {
    document: ICredential;
    status: string;
    credentialOfferSessionId: string | null;
  }): Promise<void>;

  findById(id: string): Promise<ICredential | null>;

  update(
    id: string,
    params: {
      status?: string;
      [key: string]: unknown;
    },
  ): Promise<void>;
}
