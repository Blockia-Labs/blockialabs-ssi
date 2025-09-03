import { IDIDMethod } from '../../interfaces/registry/IDIDMethod.js';

export class DIDMethodRegistry {
  private methods: Map<string, IDIDMethod> = new Map();

  register(prefix: string, method: IDIDMethod): void {
    this.methods.set(prefix, method);
  }

  has(prefix: string): boolean {
    return this.methods.has(prefix);
  }

  get(prefix: string): IDIDMethod | undefined {
    return this.methods.get(prefix);
  }

  getAll(): Map<string, IDIDMethod> {
    return new Map(this.methods);
  }
}
