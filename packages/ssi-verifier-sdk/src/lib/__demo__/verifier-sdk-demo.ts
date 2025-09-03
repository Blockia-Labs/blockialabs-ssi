// Todo: Keep this package clean from demo code
// Move this demo to a separate package or folder e.g. scripts
import jwt from 'jsonwebtoken';
import { KeyDIDMethod, KeyDIDResolver } from '@blockialabs/ssi-did-key';
import { InMemoryStorage } from '@blockialabs/ssi-storage';
import { PresentationDefinition } from '../types/PresentationDefinition.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { TokenRecord } from '../services/TokenManager.js';
import { Transaction } from '../types/Authorization.js';
import { VerifierSDK } from '../verifier-sdk.js';
import {
  CredentialFormatType,
  CredentialProcessor,
  ISchemaVerifier,
  JsonLdHandler,
} from '@blockialabs/ssi-credentials';

// ES256 (ECDSA P-256) private key for token signing
const SIGNING_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgrDBYjeoBXkikSxa8
AmLZocKJQ7AmUida7szNJmwYu4OhRANCAARBDhtooipWcscLvx33OMCg2Qg82mTf
+IVxU7tyfcgI48YYxgOcSFoeHVaqbrBSzXOtYPU1Rxiy/gfiDEn8l+cs
-----END PRIVATE KEY-----`;

// ES256 (ECDSA P-256) public key for token verification
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQQ4baKIqVnLHC78d9zjAoNkIPNpk
3/iFcVO7cn3ICOPGGMYDnEhaHh1Wqm6wUs1zrWD1NUcYsv4H4gxJ/JfnLA==
-----END PUBLIC KEY-----`;

/**
 * Verify a JWT token signature using the provided public key
 * @param token - The JWT token to verify
 * @returns Whether the token signature is valid
 */
async function verifyTokenSignature(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return false;
    }

    const [headerB64] = parts;

    // Decode header to check algorithm
    const headerStr = Buffer.from(headerB64, 'base64url').toString();
    const header = JSON.parse(headerStr);

    // Print header for debugging
    console.log('Token header:', header);

    // Ensure we're dealing with an ES256 signature
    if (header.alg !== 'ES256') {
      console.error(`Unexpected algorithm: ${header.alg}, expected ES256`);
      return false;
    }

    try {
      // Verify using jsonwebtoken
      const verified = jwt.verify(token, PUBLIC_KEY, { algorithms: ['ES256'] });
      console.log('JWT verification result:', verified ? 'Valid' : 'Invalid');
      return !!verified;
    } catch (jwtError) {
      console.error(
        'JWT verification error:',
        jwtError instanceof Error ? jwtError.message : String(jwtError),
      );

      return false;
    }
  } catch (error) {
    console.error(
      'Error verifying token signature:',
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

/**
 * Demo of the Verifier SDK showing the complete flow:
 * 1. Create presentation request
 * 2. Process wallet request
 * 3. Verify presentation
 * 4. Exchange for tokens
 * 5. Refresh tokens
 */
async function runVerifierSdkDemo() {
  console.log('🔍 Starting Complete Verifier SDK Demo');
  console.log('====================================');

  // Generate Secp256k1 key pairs for issuer and holder
  const issuerPrivateKey = secp256k1.utils.randomSecretKey();
  const issuerPublicKey = secp256k1.getPublicKey(issuerPrivateKey, true);

  const holderPrivateKey = secp256k1.utils.randomSecretKey();
  const holderPublicKey = secp256k1.getPublicKey(holderPrivateKey, true);

  // Setup DID resolution
  const keyMethod = new KeyDIDMethod();

  // Create DIDs using the key method
  const issuerDid = await keyMethod.create({
    publicKeyHex: Buffer.from(issuerPublicKey).toString('hex'),
  });

  const holderDid = await keyMethod.create({
    publicKeyHex: Buffer.from(holderPublicKey).toString('hex'),
  });

  const didResolver = new KeyDIDResolver(keyMethod);
  const jsonLdHandler = new JsonLdHandler();

  const schemaVerifier: ISchemaVerifier = {
    validate: async <T extends object>(content: T, schemaId: string): Promise<T> => {
      console.log('Validating schema:', schemaId);
      if (schemaId === 'https://example.org/schemas/identity.json') {
        return content;
      } else {
        throw new Error('Invalid schema');
      }
    },
  };

  const credentialProcessor = new CredentialProcessor({
    didResolver,
    schemaValidator: schemaVerifier,
    formatHandlers: {
      [CredentialFormatType.JSON_LD]: jsonLdHandler,
    },
    signatureProviders: {
      Secp256k1: {
        sign: async (data: string) => {
          // Convert string data to Uint8Array for signing
          const dataBytes = new TextEncoder().encode(data);

          // Hash the message for Secp256k1
          const messageHash = await crypto.subtle.digest('SHA-256', dataBytes);
          const messageHashBytes = new Uint8Array(messageHash);

          const signature = secp256k1.sign(messageHashBytes, issuerPrivateKey);
          return Buffer.from(signature).toString('hex');
        },
        verify: async (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => {
          try {
            // Log input values for debugging
            console.log('Verifying signature:', {
              signatureType: Buffer.from(signature).toString('hex'),
              messageType: Buffer.from(message).toString('hex'),
              publicKeyType: Buffer.from(publicKey).toString('hex'),
            });

            // Hash the message for Secp256k1
            const messageHash = await crypto.subtle.digest('SHA-256', message);
            const messageHashBytes = new Uint8Array(messageHash);

            return secp256k1.verify(signature, messageHashBytes, publicKey);
          } catch (error) {
            console.error('Signature verification error:', error);
            return false;
          }
        },
      },
    },
  });

  // Create storage instances for the demo
  const transactionStorage = new InMemoryStorage<Transaction>();
  const tokenStorage = new InMemoryStorage<TokenRecord>();
  const presentationStorage = new InMemoryStorage<PresentationDefinition>();

  // Initialize verifier SDK with all required components
  const verifierSdk = VerifierSDK.create({
    baseUrl: 'https://verifier.example.com',
    clientId: 'verifier_client_123',
    credentialProcessor,
    holderDidResolver: didResolver,
    signingKey: SIGNING_KEY,
    signingKeyId: 'key-1',
    storage: {
      transactions: transactionStorage,
      tokens: tokenStorage,
      presentations: presentationStorage,
    },
  });

  try {
    // Step 1: Create a presentation request
    console.log('\n1️⃣ Creating Presentation Request...');

    const presentationDefinition = await verifierSdk.createPresentationDefinition({
      credentialTypes: ['IdentityCredential'],
      proofTypes: ['EcdsaSecp256k1Signature2019'],
      constraints: [
        {
          fields: [
            {
              path: ['$.credentialSubject.given_name'],
              purpose: 'We need your first name',
            },
          ],
        },
      ],
    });

    const authRequest = await verifierSdk.createAuthorizationRequest({
      presentationDefinition,
      nonce: 'demo_nonce_123',
      state: 'demo_state_456',
    });

    console.log('✅ Created authorization request:');
    console.log(`- Request URI: ${authRequest.requestUri}`);
    console.log(`- Transaction ID: ${authRequest.id}`);
    console.log(`- Presentation Definition ID: ${presentationDefinition.id}`);
    console.log(`- OpenID4VP URL: ${authRequest.openId4VPUrl}`);

    // Step 2: Process wallet request
    console.log('\n2️⃣ Processing Wallet Request...');

    const authResponse = await verifierSdk.processRequestUri({
      transactionId: authRequest.id,
      walletMetadata: JSON.stringify({
        vp_formats_supported: {
          jwt_vp: { alg: ['ES256'] },
        },
      }),
    });

    console.log('✅ Generated authorization response:');
    console.log(`- Response URI: ${authResponse.response.responseUri}`);

    // Step 3: Verify presentation (simulating wallet response)
    console.log('\n3️⃣ Verifying Presentation...');

    // Create mock VP token (in real scenario this comes from wallet)
    const vpToken = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      'type': ['VerifiablePresentation'],
      'verifiableCredential': [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          'id': 'http://example.com/credentials/123',
          'type': ['VerifiableCredential', 'IdentityCredential'],
          'issuer': issuerDid.did,
          'validFrom': '2024-04-14T00:00:00Z',
          'validUntil': '2026-04-14T00:00:00Z',
          'credentialSubject': {
            id: holderDid.did,
            given_name: 'Alice',
            family_name: 'Smith',
          },
          'credentialSchema': {
            id: 'https://example.org/schemas/identity.json',
            type: 'JsonSchemaValidator2018',
          },
          // Add proof for the credential
          'proof': {
            type: 'EcdsaSecp256k1Signature2019',
            created: '2024-04-14T00:00:00Z',
            verificationMethod: `${issuerDid.did}#controllerKey`,
            proofPurpose: 'assertionMethod',
            proofValue: 'z43MrLd5Ah8qw8y7kJ6XVt4VZa3e4KxH2VGvJmHtNzCR9Q5Q8G7U4C2B9P8E6F1',
          },
        },
      ],
      'proof': {
        type: 'EcdsaSecp256k1Signature2019',
        created: '2024-04-14T00:00:00Z',
        verificationMethod: `${holderDid.did}#controllerKey`,
        proofPurpose: 'authentication',
        challenge: 'demo_nonce_123',
        domain: 'verifier_client_123', // Add domain to match the client ID
        proofValue: 'z3MrLd5Ah8qw8y7kJ6XVt4VZa3e4KxH2VGvJmHtNzCR9Q5Q8G7U4C2B9P8E6F1',
      },
    };

    const presentationResponse = await verifierSdk.verifyPresentation({
      vpToken: JSON.stringify(vpToken),
      presentationSubmission: JSON.stringify({
        id: 'submission_123',
        definition_id: presentationDefinition.id,
        descriptor_map: [
          {
            id: 'identity_credential',
            format: 'ldp_vc',
            path: '$.verifiableCredential[0]',
          },
        ],
      }),
      state: 'demo_state_456',
      transactionId: authRequest.id,
    });

    console.log('✅ Presentation verification result:');
    console.log(`- Verified: ${presentationResponse.verified}`);
    console.log(`- Response Code: ${presentationResponse.responseCode}`);
    console.log('- Errors:', presentationResponse.errors || 'None');

    // Step 4: Exchange response code for tokens
    console.log('\n4️⃣ Exchanging Response Code for Tokens...');

    if (!presentationResponse.responseCode) {
      throw new Error('No response code received from verification');
    }

    const tokenResponse = await verifierSdk.exchangeCodeForToken({
      responseCode: presentationResponse.responseCode,
      clientId: 'verifier_client_123',
    });

    console.log('✅ Received tokens:');
    const decodedToken = JSON.parse(
      Buffer.from(tokenResponse.access_token.split('.')[1], 'base64').toString('utf-8'),
    );
    console.log('Decoded Access Token:', decodedToken);
    console.log(
      'Decoded ID Token:',
      JSON.parse(Buffer.from(tokenResponse.id_token.split('.')[1], 'base64').toString('utf-8')),
    );
    console.log(
      'Decoded Refresh Token:',
      JSON.parse(
        Buffer.from(tokenResponse.refresh_token.split('.')[1], 'base64').toString('utf-8'),
      ),
    );
    console.log(`Expires In: ${tokenResponse.expires_in} seconds`);

    // Verify access token signature using the public key
    console.log('\n🔐 Verifying Access Token Signature...');
    const isValid = await verifyTokenSignature(tokenResponse.access_token);
    if (isValid) {
      console.log('✅ Access Token Signature: VALID');

      // Check for holder DID in subject
      const subject = decodedToken.sub;
      console.log(`🔑 Subject: ${subject}`);
    } else {
      console.log('❌ Access Token Signature: INVALID');
    }

    // Step 5: Refresh tokens
    console.log('\n5️⃣ Refreshing Tokens...');

    const refreshResponse = await verifierSdk.refreshTokens({
      refreshToken: tokenResponse.refresh_token,
      clientId: 'verifier_client_123',
    });

    console.log('✅ Received new tokens:');
    console.log(`- New Access Token: ${refreshResponse.access_token}`);
    console.log(`- New Refresh Token: ${refreshResponse.refresh_token}`);
    console.log(`- Expires In: ${refreshResponse.expires_in} seconds`);

    console.log('\n✅ Complete Verifier SDK Demo completed successfully!');
  } catch (error) {
    console.error('\n❌ Demo failed:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Run the demo with proper error handling
runVerifierSdkDemo().catch((error) => {
  console.error(
    '\n❌ FATAL ERROR in credential demo:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});

// Export for nx executor
export default runVerifierSdkDemo;
