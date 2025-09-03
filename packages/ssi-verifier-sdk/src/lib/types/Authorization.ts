import { ClaimWithMetadata } from './ClaimTypes.js';
import { PresentationDefinition } from './PresentationDefinition.js';
import { VerificationStatus } from './PresentationResponse.js';

/**
 * Options for creating an authorization request
 */
export interface AuthorizationRequestOptions {
  transactionId?: string;
  nonce?: string;
  state?: string;
  redirectUri?: string;
  requestUriMethod?: string;
  clientMetadata?: Record<string, any>;
}

/**
 * Parameters for an OpenID4VP authorization request
 */
export interface AuthorizationRequest {
  id: string; // Unique request identifier
  presentationDefinition?: PresentationDefinition; // Full presentation definition object
  presentationDefinitionUri?: string; // URI reference to a presentation definition
  requestUri?: string; // URI for the wallet to fetch the request / (AuthorizationResponse)
  responseUri?: string; // URI for the wallet to send the response
  state?: string; // State parameter to prevent CSRF
  nonce?: string; // Nonce to prevent replay attacks
  clientId: string; // Client identifier
  redirectUri?: string; // Redirect URI after successful presentation
  qrCode?: string; // QR code data for mobile wallet scanning
  expiresIn?: number; // Expiration time in seconds
  createdAt: number; // Creation timestamp
  openId4VPUrl?: string; // Added field to store the OpenID4VP URL for direct linking
}

/**
 * Pqrameters to send to the wallet for authorization (a streamined authroization request)
 * This is a simplified version of the full authorization request that the wallet needs to respond to
 */
export interface AuthorizationResponse {
  id: string; // Request identifier
  responseUri?: string; // URI for the wallet to send the response
  presentationDefinition?: PresentationDefinition; // Presentation definition
  presentationDefinitionUri?: string; // URI reference to the presentation definition
  clientId: string; // Client identifier
  state?: string; // State parameter echoed from request
  nonce?: string; // Nonce echoed from request
  responseType?: string; // vp_token
  responseMode?: string; // direct_post
}

/**
 * Transaction data structure for tracking authorization requests
 */
export interface Transaction {
  id: string; // Unique transaction identifier
  status: VerificationStatus; // Current verification status
  createdAt: number; // Creation timestamp
  expiresAt: number; // Expiration timestamp

  // Request parameters
  nonce?: string; // Nonce for security
  state?: string; // State parameter for CSRF protection
  presentationDefinition: {
    // Presentation definition details
    uri?: string; // URI reference if applicable
    definition?: PresentationDefinition; // Actual definition
  };
  clientMetadata?: Record<string, any>; // Additional client metadata
  redirectUri?: string; // Redirect URI after completion

  // Response tracking
  responseCode?: string; // Code for token exchange
  responseCodeUsed?: boolean; // Whether code has been used
  verifiedAt?: number; // When verification occurred
  error?: string; // Error if verification failed
  vpErrors?: string[]; // List of VP errors

  // Wallet interaction
  walletMetadata?: Record<string, any>; // Information about the wallet
  presentationSubmission?: any; // The submission from wallet
  holderDid?: string; // DID of the holder/user who authenticated

  //  Additional openId4vp fields
  openId4VPUrl?: string; // OpenID4VP URL for direct linking
  claims?: ClaimWithMetadata[]; // Claims extracted from the presentation
}
