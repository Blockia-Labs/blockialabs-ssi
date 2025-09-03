/**
 * Type definitions index file
 * Centralizes all type exports for the verifier SDK
 */

// Enum types
export * from './Authorization.js';
export * from './PresentationDefinition.js';
export * from './PresentationResponse.js';
export * from './TokenTypes.js';
export * from './ClaimTypes.js';

export interface Claim {
  id: string;
  claim: Record<string, any>;
  metadata: Record<string, any>;
}
