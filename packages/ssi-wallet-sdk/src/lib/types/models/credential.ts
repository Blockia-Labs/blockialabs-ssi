export interface Credential {
  id: string;
  transactionId?: string;
  vcId?: string;
  name?: string;
  type?: string | string[];
  issuer?: string | { id: string };
  issueDate?: string;
  expirationDate?: string;
  status?: string;
  data: Record<string, unknown>;
}
