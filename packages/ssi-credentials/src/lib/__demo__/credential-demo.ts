// Todo: Keep this package clean from demo code
// Move this demo to a separate package or folder e.g. scripts
import crypto from 'crypto';
import { CredentialFormatType, ICredential } from '../types/credentials.js';
import { CredentialProcessor } from '../CredentialProcessor.js';
import { ICredentialSchema } from '../interfaces/ICredentialSchema.js';
import { JsonLdHandler } from '../utils/JsonLdHandler.js';
import { ProofPurpose, ProofType } from '../types/proof.js';
import { SchemaService } from '../services/SchemaService.js';
import { ISignatureProvider } from '@blockialabs/ssi-types';
import {
  IDIDResolver,
  IDIDResolutionOptions,
  IDIDResolutionMetadata,
  IDIDDocument,
  IDIDDocumentMetadata,
  VerificationMethodType,
} from '@blockialabs/ssi-did';

/**
 * Implementation of the SignatureProvider interface for the demo
 */
class DemoSignatureProvider implements ISignatureProvider {
  id: string;
  public keyPair: { publicKey: Buffer; privateKey: Buffer };

  constructor(id: string) {
    this.id = id;

    // Use hardcoded keys for demo purposes
    // In production, never hardcode keys like this
    // Generate a fresh Secp256k1 key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'der',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'der',
      },
    });

    console.log('Generated fresh Secp256k1 keypair');
    this.keyPair = { publicKey, privateKey };
  }

  /**
   * Sign data using the Secp256k1 private key
   */
  async sign(_id: string, data: string): Promise<string> {
    try {
      // Convert data string to buffer
      const dataBuffer = Buffer.from(data);

      // Create signing key from the private key DER
      const privateKey = crypto.createPrivateKey({
        key: this.keyPair.privateKey,
        format: 'der',
        type: 'pkcs8',
      });

      // Create signature
      const signature = crypto.sign(null, dataBuffer, privateKey);

      console.log('Signature Produced:', signature.toString('base64'));

      // Return base64 encoded signature
      return signature.toString('base64');
    } catch (error) {
      console.error('Signing error:', error);
      throw new Error(
        `Failed to sign data: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Verify a signature using the Secp256k1 public key
   */
  async verify(
    signature: Uint8Array,
    message: Uint8Array,
    publicKey: Uint8Array,
    _options?: Record<string, unknown>,
  ): Promise<boolean> {
    console.log(`Verifying signature with ${this.id}'s key`);

    try {
      // Convert Uint8Array to Buffer for Node.js crypto API
      const publicKeyBuffer = Buffer.from(publicKey);
      const messageBuffer = Buffer.from(message);
      const signatureBuffer = Buffer.from(signature);

      // Create public key from the DER
      const pubKey = crypto.createPublicKey({
        key: publicKeyBuffer,
        format: 'der',
        type: 'spki',
      });

      // Verify signature cryptographically
      const result = crypto.verify(null, messageBuffer, pubKey, signatureBuffer);
      console.log(`Signature verification result for ${this.id}:`, result);
      return result;
    } catch (error) {
      console.error(`Verification error (${this.id}):`, error);
      return false;
    }
  }
}

/**
 * Mock DID Resolver for demo purposes
 */
class MockDIDResolver implements IDIDResolver {
  readonly prefix = 'key';
  private publicKey: Buffer;

  constructor(publicKey: Buffer) {
    this.publicKey = publicKey;
  }

  async resolve(
    did: string,
    _resolutionOptions: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocument: IDIDDocument | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    console.log(`Resolving DID: ${did}`);

    const didResolutionMetadata: IDIDResolutionMetadata = {};
    const didDocumentMetadata: IDIDDocumentMetadata = {};

    const didDocument: IDIDDocument = {
      id: did,
      verificationMethod: [
        {
          id: `${did}#keys-1`,
          type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
          controller: did,
          publicKeyMultibase: this.publicKey.toString('base64'),
        },
      ],
    } as IDIDDocument;

    return { didResolutionMetadata, didDocument, didDocumentMetadata };
  }

  async resolveRepresentation(
    did: string,
    resolutionOptions: IDIDResolutionOptions = {},
  ): Promise<{
    didResolutionMetadata: IDIDResolutionMetadata;
    didDocumentStream: ReadableStream<Uint8Array> | null;
    didDocumentMetadata: IDIDDocumentMetadata;
  }> {
    console.log(`Resolving representation for DID: ${did}`);

    const { didResolutionMetadata, didDocument, didDocumentMetadata } = await this.resolve(
      did,
      resolutionOptions,
    );

    let didDocumentStream: ReadableStream<Uint8Array> | null = null;

    if (didDocument) {
      const encoder = new TextEncoder();
      const documentBytes = encoder.encode(JSON.stringify(didDocument));

      didDocumentStream = new ReadableStream({
        start(controller) {
          controller.enqueue(documentBytes);
          controller.close();
        },
      });
    }

    return { didResolutionMetadata, didDocumentStream, didDocumentMetadata };
  }

  // Keep additional utility methods that were in the original implementation
  async verify(did: string, _document: unknown): Promise<{ valid: boolean; reason?: string }> {
    console.log(`Verifying DID document for: ${did}`);
    // Always return valid for demo purposes
    return { valid: true };
  }

  register(prefix: string, _method: unknown): void {
    console.log(`Registering method for prefix: ${prefix}`);
    // No-op for mock implementation
  }
}

/**
 * Run the credential services demo
 */
async function runCredentialServicesDemo() {
  console.log('Starting Credential Services Demo');
  console.log('---------------------------------');

  // 1. Set up services
  const signatureProvider = new DemoSignatureProvider('did:example:issuer123');
  const didResolver = new MockDIDResolver(signatureProvider.keyPair.publicKey);
  const schemaValidator = new SchemaService();
  const jsonLdHandler = new JsonLdHandler();

  // Create services with proper dependencies
  const credentialService = new CredentialProcessor({
    didResolver,
    schemaValidator,
    formatHandlers: {
      [CredentialFormatType.JSON_LD]: jsonLdHandler,
    },
    signatureProviders: {
      Secp256k1: signatureProvider,
    },
  });

  // 2. Define and register a credential schema
  const credentialSchema: ICredentialSchema = {
    $id: 'https://example.com/schemas/identity.json',
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'JsonSchema',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
    },
    required: ['id', 'name'],
    additionalProperties: false,
  };

  schemaValidator.registerSchema(credentialSchema);
  console.log('Schema registered with ID:', credentialSchema.$id);

  // 3. Create credential data
  const credentialData: Partial<ICredential> = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    'id': 'http://example.com/credentials/1234',
    'type': ['VerifiableCredential', 'IdentityCredential'],
    'issuer': 'did:example:issuer123',
    'name': 'Identity Credential',
    'description': 'A verifiable identity credential',
    'validFrom': new Date().toISOString(),
    'credentialSubject': {
      id: 'did:example:subject456',
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    'credentialSchema': {
      id: 'https://example.com/schemas/identity.json',
      type: 'JsonSchemaValidator2018',
    },
  };

  try {
    // 4. Create the credential
    console.log('\nCreating credential...');
    const preparedCredential = await credentialService.prepareIssuance(
      credentialData as ICredential,
      {},
    );
    const credential = preparedCredential.credential;
    console.log('Credential created successfully!');
    console.log('Credential ID:', credential.id);
    console.log('Credential types:', credential.type);

    // 5. Validate the credential against schema
    console.log('\nValidating credential against schema...');
    const isValidSchema = schemaValidator.validateCredential(credential);
    console.log('Schema validation result:', isValidSchema);

    // 6. Issue the credential (add proof)
    console.log('\nIssuing credential...');
    const signedCredential = await credentialService.issue(credential, {
      // prepare specific options
      proofType: ProofType.EcdsaSecp256k1Signature2019,
      proofPurpose: ProofPurpose.AssertionMethod,
      challenge: 'demo-challenge-123',
      domain: 'example.com',
      // complete specific options
      verificationMethod: 'did:example:issuer123#keys-1',
      signatureType: 'Secp256k1',
    });

    console.log('Credential issued with proof!');
    // Log proof details
    console.log(
      'Credential proof:',
      Array.isArray(signedCredential.proof) ? signedCredential.proof[0] : signedCredential.proof,
    );

    console.log('\nDemo completed successfully!');
  } catch (error) {
    console.error(
      'Error in credential services demo:',
      error instanceof Error ? error.message : error,
    );
  }
}

// Run the demo
runCredentialServicesDemo().catch((error) => {
  console.error('Fatal error in credential demo:', error instanceof Error ? error.message : error);
  process.exit(1);
});

// Export for nx executor if needed
export default runCredentialServicesDemo;
