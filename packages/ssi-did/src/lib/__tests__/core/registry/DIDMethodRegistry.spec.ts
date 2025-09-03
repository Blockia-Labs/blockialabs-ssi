import { DIDMethodRegistry } from '../../../core/registry/DIDMethodRegistry.js';
import { IDIDMethod } from '../../../interfaces/registry/IDIDMethod.js';

describe('DIDMethodRegistry', () => {
  let registry: DIDMethodRegistry;
  let mockMethod: IDIDMethod;

  beforeEach(() => {
    registry = new DIDMethodRegistry();
    mockMethod = {
      create: jest.fn(),
      resolve: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };
  });

  it('should register a DID method', () => {
    registry.register('test', mockMethod);
    expect(registry.has('test')).toBe(true);
    expect(registry.get('test')).toBe(mockMethod);
  });

  it('should retrieve a registered DID method', () => {
    registry.register('test', mockMethod);
    const retrievedMethod = registry.get('test');
    expect(retrievedMethod).toBeDefined();
    expect(retrievedMethod).toBe(mockMethod);
  });

  it('should return undefined for unregistered DID method', () => {
    const retrievedMethod = registry.get('nonexistent');
    expect(retrievedMethod).toBeUndefined();
  });

  it('should check if a method exists', () => {
    registry.register('test', mockMethod);
    expect(registry.has('test')).toBe(true);
    expect(registry.has('nonexistent')).toBe(false);
  });

  it('should get all registered methods', () => {
    const mockMethod2: IDIDMethod = {
      create: jest.fn(),
      resolve: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    registry.register('test', mockMethod);
    registry.register('test2', mockMethod2);

    const allMethods = registry.getAll();
    expect(allMethods).toBeInstanceOf(Map);
    expect(allMethods.size).toBe(2);
    expect(allMethods.get('test')).toBe(mockMethod);
    expect(allMethods.get('test2')).toBe(mockMethod2);
  });

  it('should override existing method with same prefix', () => {
    const mockMethod2: IDIDMethod = {
      create: jest.fn(),
      resolve: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    registry.register('test', mockMethod);
    registry.register('test', mockMethod2);

    expect(registry.get('test')).toBe(mockMethod2);
  });

  it('should maintain method isolation', () => {
    const mockMethod2: IDIDMethod = {
      create: jest.fn(),
      resolve: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    registry.register('test', mockMethod);
    registry.register('test2', mockMethod2);

    // Modify the returned map
    const methods = registry.getAll();
    methods.delete('test');

    // Original registry should be unaffected
    expect(registry.has('test')).toBe(true);
    expect(registry.get('test')).toBe(mockMethod);
  });
});
