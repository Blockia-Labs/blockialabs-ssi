import { IPreparedCredential, ICredential } from '@blockialabs/ssi-credentials';
import { CredentialOffer, NotificationRequest } from './offer.js';

/**
 * Credential offer session
 */
export interface CredentialOfferSession {
  id: string;
  preAuthorizedCode: string;
  issuerState?: string;
  createdAt: number;
  lastUpdatedAt: number;
  notificationStatus: string;
  notificationId: string;
  notification?: NotificationRequest;
  pin?: string;
  error?: string;
  credentialOffer: CredentialOffer;
  credentialDataSupplierInput?: any;
  statusLists?: Array<any>;
  transactionId?: string;
  pendingCredential?: IPreparedCredential;
  credentialResponse?: ICredential;
  issuerId?: string;
}
