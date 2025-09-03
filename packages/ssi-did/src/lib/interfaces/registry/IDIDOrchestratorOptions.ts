import { ISignatureProvider } from '@blockialabs/ssi-types';
import { DIDMethodRegistry } from '../../core/registry/DIDMethodRegistry.js';
import { DIDResolverRegistry } from '../../core/registry/DIDResolverRegistry.js';

/**
 * @interface DIDOrchestratorOptions
 * @description Configuration options for initializing a DID Orchestrator
 */
export interface IDIDOrchestratorOptions {
  /**
   * Registry for DID methods
   */
  methodRegistry: DIDMethodRegistry;

  /**
   * Registry for DID resolvers
   */
  resolverRegistry: DIDResolverRegistry;

  /**
   * Optional mapping of signature types to signature providers
   */
  signatureProviders?: Record<string, ISignatureProvider>;
}
