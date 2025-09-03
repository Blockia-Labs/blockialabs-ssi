import { CredentialOfferSession } from './session.js';

export interface CredentialOffer {
  credential_issuer: string;
  credential_configuration_ids: string[];
  grants?: Record<string, any>;
}

export interface TxCodeOptions {
  length?: number;
  input_mode?: 'text' | 'numeric';
}

export interface CredentialOfferResult {
  uri: string;
  qrCode?: string;
  session: CredentialOfferSession;
  pin?: string;
}

export interface NotificationRequest {
  notification_id: string;
  event: 'credential_accepted' | 'credential_deleted' | 'credential_failure';
  error?: string;
}
