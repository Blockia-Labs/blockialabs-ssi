// Constants and Enums
export * from './lib/constants/index.js';

// DID String
export { DIDStringBuilder } from './lib/core/did-string/DIDStringBuilder.js';
export { DIDStringValidator } from './lib/core/did-string/DIDStringValidator.js';

// DID Document
export { DIDDocumentBuilder } from './lib/core/did-document/DIDDocumentBuilder.js';
export { DIDDocumentSerializer } from './lib/core/did-document/DIDDocumentSerializer.js';
export { DIDDocumentVerifier } from './lib/core/did-document/DIDDocumentVerifier.js';

// Registry
export { DIDMethodRegistry } from './lib/core/registry/DIDMethodRegistry.js';
export { DIDResolverRegistry } from './lib/core/registry/DIDResolverRegistry.js';

// Higher-level Orchestration Module
export { DIDOrchestrator } from './lib/orchestration/DIDOrchestrator.js';

// DID String Interfaces
export type { IDIDStringBuilder } from './lib/interfaces/did-string/IDIDStringBuilder.js';

// DID Document Interfaces
export type { IDIDDocument } from './lib/interfaces/did-document/IDIDDocument.js';
export type { IDIDDocumentBuilder } from './lib/interfaces/did-document/IDIDDocumentBuilder.js';
export type { IDIDDocumentMetadata } from './lib/interfaces/did-document/IDIDDocumentMetadata.js';
export type { ILinkedResource } from './lib/interfaces/did-document/ILinkedResource.js';
export type { IProof } from './lib/interfaces/did-document/IProof.js';
export type { IService } from './lib/interfaces/did-document/IService.js';
export type { IVerificationMethod } from './lib/interfaces/did-document/IVerificationMethod.js';

// DID Document Operations Interfaces
export type { IDidDocumentUpdateOperations } from './lib/interfaces/operations/IDidDocumentUpdateOperations.js';
export type { IDidDocumentUpdatePayload } from './lib/interfaces/operations/IDidDocumentUpdatePayload.js';
export type { IDIDDocumentVerificationResult } from './lib/interfaces/operations/IDIDDocumentVerificationResult.js';
export type { IDIDPreparationResult } from './lib/interfaces/operations/IDIDPreparationResult.js';
export type { IDIDUpdatePreparationResult } from './lib/interfaces/operations/IDIDUpdatePreparationResult.js';

// Registry Interfaces
export type {
  IDIDResolutionMetadata,
  IDIDResolutionOptions,
} from './lib/interfaces/did-document/IDIDResolutionMetadata.js';
export type { IDIDMethod } from './lib/interfaces/registry/IDIDMethod.js';
export type { IDIDOrchestratorOptions } from './lib/interfaces/registry/IDIDOrchestratorOptions.js';
export type { IDIDResolver } from './lib/interfaces/registry/IDIDResolver.js';
