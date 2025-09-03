import {
  IIssuerKeyStore,
  IProofValidator,
  ISessionManager,
  IVCRepository,
} from '../interfaces/index.js';
import { CredentialProcessor } from '@blockialabs/ssi-credentials';
import { IRevocationManager } from '@blockialabs/ssi-revocation';
import { ISignatureProvider } from '@blockialabs/ssi-types';

/**
 * IssuerConfig following OpenID4VCI specification
 */
export interface IssuerConfig {
  // Required fields
  credential_issuer: string;
  credential_endpoint: string;
  credential_configurations_supported: Record<string, CredentialConfigurationSupported>;

  // Optional fields
  authorization_servers?: string[];
  deferred_credential_endpoint?: string;
  nonce_endpoint?: string;
  notification_endpoint?: string;
  credential_response_encryption?: ResponseEncryption;
  token_endpoint?: string;
  display?: MetadataDisplay[];
  authorization_challenge_endpoint?: string;
}

/**
 * Credential configuration following OpenID4VCI specification
 */
export interface CredentialConfigurationSupported {
  format: string;

  // Format-specific fields that may be required based on format
  credential_definition?: {
    'type': string[];
    '@context'?: string[]; // For JSON-LD formats
  };

  // Optional fields
  scope?: string;
  claims?: CredentialClaimPath[];
  cryptographic_binding_methods_supported?: string[];
  credential_signing_alg_values_supported?: string[];
  proof_types_supported?: Record<string, unknown>;
  display?: MetadataDisplay[];
}

export interface CredentialClaimPath {
  path: string[];
  mandatory?: boolean;
  value_type?: string;
  display?: {
    name: string;
    locale?: string;
  }[];
}

export interface ResponseEncryption {
  alg_values_supported: string[];
  enc_values_supported: string[];
  encryption_required: boolean;
}

export interface MetadataDisplay {
  name?: string;
  locale?: string;
  logo?: LogoDisplay;
  description?: string;
  background_color?: string;
  text_color?: string;
}

export interface LogoDisplay {
  uri: string;
  alt_text?: string;
}

export interface CredentialOfferOptions {
  baseUrl?: string;
  generateQR?: boolean;
  qrCodeOptions?: QRCodeOptions;
}

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  colorDark?: string;
  colorLight?: string;
}

// Add this interface
export interface IssuerOptions {
  cNonceExpiresIn?: number;
  sessionManager: ISessionManager;
  credentialProcessor: CredentialProcessor;
  vcRepository?: IVCRepository;
  proofValidators: Map<string, IProofValidator>;
  revocationNeeded?: IRevocationManager;
  keyStore?: IIssuerKeyStore;
  signatureProvider: ISignatureProvider;
}
