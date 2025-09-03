import { JWK } from '@blockialabs/ssi-types';

export class KeyRecord {
  id: string;
  key: JWK;
  createdAt: Date;
  updatedAt: Date;

  constructor(id: string, key: JWK) {
    this.id = id;
    this.key = key;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
