import {
  CredentialProcessor,
  CredentialFormatType,
  ICredential,
  IProof,
  ProofType,
  ProofPurpose,
  IPreparedCredential,
  ICompleteOptions,
} from '@blockialabs/ssi-credentials';
import { CredentialIssuer } from '../CredentialIssuer.js';
import { IProofValidator, ISessionManager } from '../interfaces/index.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import {
  CredentialOffer,
  CredentialOfferSession,
  CredentialRequest,
  DeferredCredentialErrorCode,
  DeferredCredentialRequest,
  IssuerConfig,
  IssueStatus,
  NotificationRequest,
} from '../types.js';

// Mocks
jest.mock('@blockialabs/ssi-credentials');
jest.mock('../services/IssuerSessionManager');

describe('CredentialIssuer', () => {
  // Mock classes and dependencies
  let mockSessionManager: jest.Mocked<ISessionManager>;
  let mockCredentialProcessor: jest.Mocked<CredentialProcessor>;
  let mockProofValidator: IProofValidator;
  let mockSignatureProvider: ISignatureProvider;
  let issuer: CredentialIssuer;

  // Test data
  const validConfig: IssuerConfig = {
    credential_issuer: 'https://example.com',
    credential_endpoint: 'https://example.com/credentials',
    credential_configurations_supported: {
      IdentityCredential: {
        format: CredentialFormatType.JSON_LD,
        credential_definition: {
          'type': ['VerifiableCredential', 'IdentityCredential'],
          '@context': ['https://www.w3.org/2018/credentials/v1'],
        },
        cryptographic_binding_methods_supported: ['did:example'],
        credential_signing_alg_values_supported: ['ES256', 'ES256'],
      },
    },
    display: [
      {
        name: 'Example Issuer',
        locale: 'en-US',
        logo: {
          uri: 'https://example.com/logo.png',
          alt_text: 'Example Issuer Logo',
        },
      },
    ],
  };

  const mockCredentialOffer: CredentialOffer = {
    credential_issuer: 'https://example.com',
    credential_configuration_ids: ['IdentityCredential'],
  };

  const mockSession: CredentialOfferSession = {
    id: 'session-id-123',
    createdAt: Date.now(),
    lastUpdatedAt: Date.now(),
    preAuthorizedCode: 'pre-auth-code-123',
    transactionId: 'transaction-id-123',
    notificationId: 'notification-id-123',
    notificationStatus: 'created',
    issuerState: 'issuer-state-123',
    credentialOffer: mockCredentialOffer,
  };

  const mockCredential: ICredential & { proof: IProof } = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    'id': 'http://example.edu/credentials/3732',
    'type': ['VerifiableCredential', 'IdentityCredential'],
    'issuer': 'did:example:123',
    'validFrom': '2023-06-01T19:23:24Z',
    'credentialSubject': {
      id: 'did:example:456',
      name: 'Test Subject',
    },
    'name': 'Test Credential',
    'description': 'A test credential for unit tests',
    'credentialSchema': { id: 'https://example.com/schemas/test', type: 'JsonSchema' },
    'proof': {
      type: ProofType.EcdsaSecp256k1Signature2019,
      created: '2023-06-01T19:23:24Z',
      proofPurpose: ProofPurpose.AssertionMethod,
      verificationMethod: 'did:example:123#key-1',
      proofValue: 'eyJhbGciOi...',
    },
  };

  const mockPreparedCredential: IPreparedCredential = {
    credential: mockCredential,
    canonicalForm: 'canonical-data',
    credentialFormat: CredentialFormatType.JSON_LD,
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSessionManager = {
      get: jest.fn().mockResolvedValue(mockSession),
      getByNonce: jest.fn().mockResolvedValue({ session: mockSession, nonceState: {} }),
      createOrUpdate: jest.fn().mockResolvedValue(mockSession),
      rotateNonce: jest.fn(),
      delete: jest.fn(),
      saveNonce: jest.fn(),
      getAll: jest.fn().mockResolvedValue([mockSession]),
      getAllByIssuer:jest.fn().mockResolvedValue([mockSession]),
    };

    mockCredentialProcessor = {
      prepareIssuance: jest.fn().mockResolvedValue(mockPreparedCredential),
      completeIssuance: jest.fn().mockResolvedValue(mockCredential),
      verify: jest.fn(),
      registerSignatureProvider: jest.fn(),
    } as unknown as jest.Mocked<CredentialProcessor>;

    mockProofValidator = {
      validate: jest.fn(),
    };

    mockSignatureProvider = {
      sign: jest.fn().mockResolvedValue('mock-signature'),
      verify: jest.fn().mockResolvedValue(true),
    };

    const proofValidators = new Map<string, IProofValidator>();
    proofValidators.set(ProofType.EcdsaSecp256k1Signature2019, mockProofValidator);

    issuer = new CredentialIssuer(validConfig, {
      sessionManager: mockSessionManager,
      credentialProcessor: mockCredentialProcessor,
      proofValidators,
      signatureProvider: mockSignatureProvider,
    });
  });

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      expect(issuer).toBeDefined();
    });

    it('should throw error with invalid config', () => {
      const invalidConfig = { ...validConfig, credential_issuer: undefined };
      expect(() => {
        new CredentialIssuer(invalidConfig as never, {
          sessionManager: mockSessionManager,
          credentialProcessor: mockCredentialProcessor,
          proofValidators: new Map(),
          signatureProvider: mockSignatureProvider,
        });
      }).toThrow();
    });
  });

  describe('submitCredentialRequest', () => {
    const mockRequest: CredentialRequest = {
      credential_types: ['IdentityCredential'],
      format: CredentialFormatType.JSON_LD,
      proof: {
        proof_type: ProofType.EcdsaSecp256k1Signature2019,
        jwt: 'eyJ0eXAi...',
      },
    };

    it('should process credential request', async () => {
      mockSessionManager.createOrUpdate.mockResolvedValue({
        ...mockSession,
        issuerState: IssueStatus.CREDENTIAL_ISSUED,
      });

      const result = await issuer.submitCredentialRequest({
        credentialRequest: mockRequest,
        credential: mockCredential,
        responseCNonce: 'test-nonce',
      });

      expect(result).toBeDefined();
      expect(mockCredentialProcessor.prepareIssuance).toHaveBeenCalled();
    });
  });

  describe('checkCredentialRequestStatus', () => {
    const mockDeferredRequest: DeferredCredentialRequest = {
      transaction_id: 'transaction-id-123',
    };

    it('should return pending status for deferred issuance', async () => {
      mockSessionManager.get.mockResolvedValue({
        ...mockSession,
        issuerState: IssueStatus.DEFERRED,
        transactionId: 'transaction-id-123',
      });

      const result = await issuer.checkCredentialRequestStatus(mockDeferredRequest);

      expect(result).toEqual({
        error: DeferredCredentialErrorCode.ISSUANCE_PENDING,
        interval: 5,
      });
    });

    it('should return credential for completed issuance', async () => {
      const sessionWithCredential = {
        ...mockSession,
        issuerState: IssueStatus.CREDENTIAL_ISSUED,
        transactionId: 'transaction-id-123',
        pendingCredential: mockPreparedCredential,
        credentialResponse: mockCredential,
      };

      mockSessionManager.get.mockResolvedValue(sessionWithCredential);
      mockSessionManager.createOrUpdate.mockResolvedValue({
        ...sessionWithCredential,
        issuerState: IssueStatus.CREDENTIAL_CLAIMED,
        transactionId: undefined,
      });

      const result = await issuer.checkCredentialRequestStatus(mockDeferredRequest);

      expect(result).toHaveProperty('credentials');
    });
  });

  describe('approveCredentialRequest', () => {
    it('should approve and issue credential', async () => {
      const sessionWithPendingCredential = {
        ...mockSession,
        issuerState: IssueStatus.DEFERRED,
        pendingCredential: mockPreparedCredential,
      };

      mockSessionManager.get.mockResolvedValue(sessionWithPendingCredential);
      mockCredentialProcessor.completeIssuance.mockResolvedValue(mockCredential);
      mockSessionManager.createOrUpdate.mockResolvedValue({
        ...sessionWithPendingCredential,
        issuerState: IssueStatus.CREDENTIAL_ISSUED,
        credentialResponse: mockCredential,
      });

      const completeOptions: ICompleteOptions = {
        signature: 'mock-signature',
        verificationMethod: 'did:example:123#key-1',
        signatureType: 'Secp256k1',
        proofType: ProofType.EcdsaSecp256k1Signature2019,
        proofPurpose: ProofPurpose.AssertionMethod,
      };

      const result = await issuer.approveCredentialRequest('transaction-id-123', completeOptions);

      expect(result).toHaveProperty('credentials');
    });
  });

  describe('saveSession', () => {
    it('should save session data', async () => {
      mockSessionManager.createOrUpdate.mockResolvedValue(mockSession);

      await issuer.saveSession('session-id-123', mockSession);

      expect(mockSessionManager.createOrUpdate).toHaveBeenCalled();
    });
  });

  describe('processNotification', () => {
    const notification: NotificationRequest = {
      notification_id: 'notification-id-123',
      event: 'credential_accepted',
    };

    it('should process notification', async () => {
      mockSessionManager.get.mockResolvedValue(mockSession);
      mockSessionManager.createOrUpdate.mockResolvedValue({
        ...mockSession,
        notificationStatus: 'notification_received',
        notification,
      });

      const result = await issuer.processNotification('pre-auth-code-123', undefined, notification);

      expect(result).not.toBeInstanceOf(Error);
    });
  });
});
