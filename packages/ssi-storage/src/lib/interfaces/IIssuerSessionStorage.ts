import { IStorage } from './IStorage.js';

export interface IIssuerSessionStorage<T=unknown> extends IStorage<T>{
  getAllByIssuer(issuerId: string): Promise<T[]>;
}