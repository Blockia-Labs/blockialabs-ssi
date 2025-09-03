// TODO: Decouple crypto lib from storage lib
// TODO: Implement secure vault storage
import { IKeyStore } from '../interfaces/IKeyStore.js';
import { IStorage } from '@blockialabs/ssi-storage';
import { JWK } from '@blockialabs/ssi-types';
import { KeyRecord } from './KeyRecord.js';

export class VaultKeyStore implements IKeyStore {
  constructor(private readonly storage: IStorage<KeyRecord>) {}

  async saveKey(kid: string, key: JWK): Promise<void> {
    const record = new KeyRecord(kid, key);
    await this.storage.set(kid, record);
  }

  async getKey(kid: string): Promise<JWK | null> {
    const record = await this.storage.get(kid);
    return record?.key || null;
  }

  async deleteKey(kid: string): Promise<void> {
    await this.storage.delete(kid);
  }

  async listKeys(): Promise<string[]> {
    const records = await this.storage.keys();
    return records.map((recordId: string) => recordId);
  }
}
