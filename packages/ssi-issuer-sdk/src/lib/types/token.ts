/**
 * Token request in the pre-authorized code flow
 */
export interface TokenRequest {
  'grant_type': string;
  'pre-authorized_code': string;
  'tx_code'?: string;
  'authorization_details'?: string | AuthorizationDetails[];
  'client_id'?: string;
  [key: string]: any;
}

/**
 * Authorization details for credential issuance
 */
export interface AuthorizationDetails {
  type: string; // 'openid_credential'
  credential_configuration_id?: string;
  credential_identifiers?: string[];
  format?: string;
  [key: string]: any;
}

/**
 * Token response in the pre-authorized code flow
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  authorization_details?: AuthorizationDetails[];
  [key: string]: any;
}

/**
 * Token error response
 */
export interface TokenErrorResponse {
  error: string;
  error_description?: string;
}
