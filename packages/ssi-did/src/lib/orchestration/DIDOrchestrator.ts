import crypto from 'crypto';
import { DIDMethodRegistry } from '../core/registry/DIDMethodRegistry.js';
import { DIDResolverRegistry } from '../core/registry/DIDResolverRegistry.js';
import { IDIDDocument } from '../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentMetadata } from '../interfaces/did-document/IDIDDocumentMetadata.js';
import { IDIDMethod } from '../interfaces/registry/IDIDMethod.js';
import { IDIDOrchestratorOptions } from '../interfaces/registry/IDIDOrchestratorOptions.js';
import { IDIDResolver } from '../interfaces/registry/IDIDResolver.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import { verifySignature } from '@blockialabs/ssi-utils';

export class DIDOrchestrator {
  private methodRegistry: DIDMethodRegistry;
  private resolverRegistry: DIDResolverRegistry;
  private signatureProviders: Map<string, ISignatureProvider> = new Map();

  constructor(options: IDIDOrchestratorOptions) {
    if (!options?.methodRegistry || !options?.resolverRegistry) {
      throw new Error('Method registry and resolver registry are required.');
    }

    this.methodRegistry = options.methodRegistry;
    this.resolverRegistry = options.resolverRegistry;

    if (options.signatureProviders) {
      Object.entries(options.signatureProviders).forEach(([type, provider]) => {
        this.registerSignatureProvider(type, provider);
      });
    }
  }

  // ===== CORE DID OPERATIONS =====

  /**
   * Prepares a DID creation by generating a message to sign (Signing Request).
   * @param method - The DID method to use.
   * @param options - Options, including publicKeyHex and signatureType for Client-managed Secret Mode.
   * @returns - Message to sign and serialized payload (base64).
   */
  async prepareDid(
    method: string,
    options: { publicKeyHex: string; signatureType?: string },
  ): Promise<{ message: string; serializedPayload: string }> {
    if (!options?.publicKeyHex) {
      throw new Error('publicKeyHex is required for DID preparation.');
    }

    const payload = {
      alg: options.signatureType || 'ES256',
      method,
      nonce: crypto.randomBytes(16).toString('hex'),
      operation: 'create',
      publicKeyHex: options.publicKeyHex,
      timestamp: new Date().toISOString(),
    };

    const message = JSON.stringify(payload);
    const serializedPayload = Buffer.from(message).toString('base64');

    return { message, serializedPayload };
  }

  /**
   * Completes DID creation by validating the signature and finalizing the DID Document.
   * @param method - The DID method used for creation.
   * @param options - Options: keyId, publicKeyHex, signature, signatureType, serializedPayload.
   * @returns - Finalized DID Document and DID.
   */
  async completeDid(
    method: string,
    options: {
      keyId?: string;
      publicKeyHex: string;
      signature: string;
      signatureType: string;
      serializedPayload: string;
    },
  ): Promise<{ did: string; didDocument: IDIDDocument }> {
    const decodedPayload = Buffer.from(options.serializedPayload, 'base64').toString();
    const payload = JSON.parse(decodedPayload);

    this.validateRequestExpiration(payload.timestamp, 'DID creation');

    if (payload.method !== method || payload.publicKeyHex !== options.publicKeyHex) {
      throw new Error('Parameter mismatch');
    }

    const recomputedMessage = JSON.stringify({
      alg: payload.alg,
      method: payload.method,
      nonce: payload.nonce,
      operation: payload.operation,
      publicKeyHex: payload.publicKeyHex,
      timestamp: payload.timestamp,
    });

    if (decodedPayload !== recomputedMessage) {
      throw new Error('Message tampering detected');
    }

    const signatureProvider = this.getSignatureProvider(options.signatureType);
    if (!signatureProvider) {
      throw new Error(`No signature provider registered for type: ${options.signatureType}.`);
    }

    await verifySignature(
      signatureProvider,
      options.signature,
      decodedPayload,
      options.publicKeyHex,
    );

    const didMethod = this.methodRegistry.get(method);
    if (!didMethod) {
      throw new Error(`No method registered for: ${method}`);
    }

    const { did, didDocument } = await didMethod.create({
      keyId: options.keyId,
      publicKeyHex: options.publicKeyHex,
      signature: options.signature,
      signatureType: options.signatureType,
    });

    return { did, didDocument };
  }

  /**
   * Prepares an update operation by generating a message to sign (Signing Request).
   * @param method - The DID method to use.
   * @param did - The DID to update.
   * @param updatedDocument - The updated DID Document.
   * @param options - Additional options for the update operation.
   * @returns - Message to sign and serialized payload (base64).
   */
  async prepareUpdate(
    method: string,
    did: string,
    updatedDocument: IDIDDocument,
    options: { publicKeyHex: string; signatureType?: string },
  ): Promise<{ message: string; serializedPayload: string }> {
    if (!options?.publicKeyHex) {
      throw new Error('publicKeyHex is required for update preparation.');
    }

    const payload = {
      alg: options.signatureType || 'ES256',
      method,
      did,
      nonce: crypto.randomBytes(16).toString('hex'),
      operation: 'update',
      publicKeyHex: options.publicKeyHex,
      updatedDocument,
      timestamp: new Date().toISOString(),
    };

    const message = JSON.stringify(payload);
    const serializedPayload = Buffer.from(message).toString('base64');

    return { message, serializedPayload };
  }

  /**
   * Completes an update operation by validating the signature and finalizing the updated DID Document.
   * @param method - The DID method used for the update.
   * @param options - Options: keyId, publicKeyHex, signature, signatureType, serializedPayload.
   * @returns - Finalized updated DID Document.
   */
  async completeUpdate(
    method: string,
    options: {
      keyId?: string;
      publicKeyHex: string;
      signature: string;
      signatureType: string;
      serializedPayload: string;
    },
  ): Promise<IDIDDocument> {
    const decodedPayload = Buffer.from(options.serializedPayload, 'base64').toString();
    const payload = JSON.parse(decodedPayload);

    // Validate request expiration
    this.validateRequestExpiration(payload.timestamp, 'DID update');

    // Validate payload structure
    if (
      payload.operation !== 'update' ||
      payload.method !== method ||
      payload.publicKeyHex !== options.publicKeyHex
    ) {
      throw new Error('Invalid update payload');
    }

    // Verify message integrity
    const recomputedMessage = JSON.stringify({
      alg: payload.alg,
      method: payload.method,
      did: payload.did,
      nonce: payload.nonce,
      operation: payload.operation,
      publicKeyHex: payload.publicKeyHex,
      updatedDocument: payload.updatedDocument,
      timestamp: payload.timestamp,
    });

    if (decodedPayload !== recomputedMessage) {
      throw new Error('Update payload tampering detected');
    }

    const signatureProvider = this.getSignatureProvider(options.signatureType);
    if (!signatureProvider) {
      throw new Error(`No signature provider registered for type: ${options.signatureType}.`);
    }

    await verifySignature(
      signatureProvider,
      options.signature,
      decodedPayload,
      options.publicKeyHex,
    );

    // Check method registration
    const didMethod = this.methodRegistry.get(method);
    if (!didMethod) {
      throw new Error(`No method registered for: ${method}`);
    }

    // Execute update
    return didMethod.update(payload.did, payload.updatedDocument, {
      publicKeyHex: options.publicKeyHex,
      signature: options.signature,
      keyId: options.keyId,
      signatureType: options.signatureType,
    });
  }

  /**
   * Prepares a deactivation operation by generating a message to sign (Signing Request).
   * @param method - The DID method to use.
   * @param did - The DID to deactivate.
   * @param options - Additional options for the deactivation operation.
   * @returns - Message to sign and serialized payload (base64).
   */
  async prepareDeactivate(
    method: string,
    did: string,
    options: { publicKeyHex: string; signatureType?: string },
  ): Promise<{ message: string; serializedPayload: string }> {
    if (!options?.publicKeyHex) {
      throw new Error('publicKeyHex is required for deactivation preparation.');
    }

    const payload = {
      alg: options.signatureType || 'ES256',
      method,
      did,
      nonce: crypto.randomBytes(16).toString('hex'),
      operation: 'deactivate',
      publicKeyHex: options.publicKeyHex,
      timestamp: new Date().toISOString(),
    };

    const message = JSON.stringify(payload);
    const serializedPayload = Buffer.from(message).toString('base64');

    return { message, serializedPayload };
  }

  /**
   * Completes a deactivation operation by validating the signature and finalizing the deactivation.
   * @param method - The DID method used for deactivation.
   * @param options - Options: keyId, publicKeyHex, signature, signatureType, serializedPayload.
   * @returns - Deactivated DID Document and metadata.
   */
  async completeDeactivate(
    method: string,
    options: {
      keyId?: string;
      publicKeyHex: string;
      signature: string;
      signatureType: string;
      serializedPayload: string;
    },
  ): Promise<{ didDocument: IDIDDocument | null; metadata: IDIDDocumentMetadata }> {
    const decodedPayload = Buffer.from(options.serializedPayload, 'base64').toString();
    const payload = JSON.parse(decodedPayload);

    // Validate request expiration
    this.validateRequestExpiration(payload.timestamp, 'DID deactivation');

    // Validate payload structure
    if (
      payload.operation !== 'deactivate' ||
      payload.method !== method ||
      payload.publicKeyHex !== options.publicKeyHex
    ) {
      throw new Error('Invalid deactivation payload');
    }

    // Verify message integrity
    const recomputedMessage = JSON.stringify({
      alg: payload.alg,
      method: payload.method,
      did: payload.did,
      nonce: payload.nonce,
      operation: payload.operation,
      publicKeyHex: payload.publicKeyHex,
      timestamp: payload.timestamp,
    });

    if (decodedPayload !== recomputedMessage) {
      throw new Error('Deactivation payload tampering detected');
    }

    const signatureProvider = this.getSignatureProvider(options.signatureType);
    if (!signatureProvider) {
      throw new Error(`No signature provider registered for type: ${options.signatureType}.`);
    }

    await verifySignature(
      signatureProvider,
      options.signature,
      decodedPayload,
      options.publicKeyHex,
    );

    // Check method registration
    const didMethod = this.methodRegistry.get(method);
    if (!didMethod) {
      throw new Error(`No method registered for: ${method}`);
    }

    // Execute deactivation
    return didMethod.deactivate(payload.did, {
      publicKeyHex: options.publicKeyHex,
      signature: options.signature,
      keyId: options.keyId,
      signatureType: options.signatureType,
    });
  }

  /**
   * Resolves a DID to its DID Document.
   * @param did - The DID to resolve.
   * @param options - Resolution options.
   * @returns The resolved DID Document.
   */
  async resolve(did: string, options?: Record<string, unknown>): Promise<IDIDDocument> {
    if (!did) {
      throw new Error('DID is required');
    }

    const [, method] = did.split(':');
    const resolver = this.resolverRegistry.get(method);

    if (!resolver) {
      throw new Error(`No resolver registered for method: ${method}`);
    }

    const { didDocument } = await resolver.resolve(did, options || {});
    if (!didDocument) {
      throw new Error('Failed to resolve DID');
    }

    return didDocument;
  }

  // ===== PRIVATE HELPER METHODS =====
  /**
   * Validates if the request has expired based on its timestamp.
   * @param timestamp - The timestamp from the request payload.
   * @param operation - The operation name for error messages.
   * @param maxAgeMs - Maximum allowed age in milliseconds (default: 5 minutes).
   */
  private validateRequestExpiration(
    timestamp: string,
    operation: string,
    maxAgeMs: number = 5 * 60 * 1000,
  ): void {
    const requestTime = new Date(timestamp);
    const currentTime = new Date();

    if (isNaN(requestTime.getTime())) {
      throw new Error(`Invalid timestamp in ${operation} request`);
    }

    if (currentTime.getTime() - requestTime.getTime() > maxAgeMs) {
      throw new Error(`${operation} request has expired.`);
    }
  }

  // ===== REGISTRY MANAGEMENT =====

  /**
   * Registers a new DID method.
   * @param prefix - The Key used to register the DID method.
   * @param method - The DID method to register.
   */
  registerMethod(prefix: string, method: IDIDMethod): void {
    this.methodRegistry.register(prefix, method);
  }

  /**
   * Registers a new DID resolver.
   * @param method - The method name for this resolver.
   * @param resolver - The resolver to register.
   */
  registerResolver(method: string, resolver: IDIDResolver): void {
    this.resolverRegistry.register(method, resolver);
  }

  /**
   * Register a signature provider
   * @param type - The type of signature (e.g., 'Secp256k1', 'JsonWebKey')
   * @param provider - The signature provider implementation
   */
  registerSignatureProvider(type: string, provider: ISignatureProvider): void {
    this.signatureProviders.set(type, provider);
  }

  // ===== REGISTRY QUERIES =====

  /**
   * Gets a specific DID method implementation.
   */
  getMethod(prefix: string): IDIDMethod | undefined {
    return this.methodRegistry.get(prefix);
  }

  /**
   * Gets a specific DID resolver implementation.
   */
  getResolver(method: string): IDIDResolver | undefined {
    return this.resolverRegistry.get(method);
  }

  /**
   * Get a signature provider by type
   * @param type - The type of signature
   * @returns The signature provider or undefined if not found
   */
  getSignatureProvider(type: string): ISignatureProvider | undefined {
    return this.signatureProviders.get(type);
  }

  // ===== STATUS QUERIES =====

  /**
   * Checks if a DID method is registered.
   * @param method - The method name to check.
   * @returns True if the method is registered.
   */
  hasMethod(method: string): boolean {
    return this.methodRegistry.has(method);
  }

  /**
   * Checks if a resolver is registered for a method.
   * @param method - The method name to check.
   * @returns True if a resolver is registered.
   */
  hasResolver(method: string): boolean {
    return this.resolverRegistry.has(method);
  }

  /**
   * Checks if a method is fully supported (has both method and resolver).
   */
  isSupported(method: string): boolean {
    return this.hasMethod(method) && this.hasResolver(method);
  }

  /**
   * Gets all registered DID methods.
   */
  get registeredMethods(): string[] {
    return Array.from(this.methodRegistry.getAll().keys());
  }

  /**
   * Gets all registered DID resolvers.
   */
  get registeredResolvers(): string[] {
    return Array.from(this.resolverRegistry.getAll().keys());
  }

  /**
   * Gets stats about registered methods and resolvers.
   */
  get stats(): {
    methods: number;
    resolvers: number;
    supported: string[];
  } {
    const methods = new Set(this.registeredMethods);
    const resolvers = new Set(this.registeredResolvers);
    const supported = Array.from(methods).filter((m) => resolvers.has(m));

    return {
      methods: methods.size,
      resolvers: resolvers.size,
      supported,
    };
  }
}
