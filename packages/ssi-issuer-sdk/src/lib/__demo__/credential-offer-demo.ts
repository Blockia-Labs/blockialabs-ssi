// Todo: Keep this package clean from demo code
// Move this demo to a separate package or folder e.g. scripts

// import { KeyDIDMethod, KeyDIDResolver } from '@blockialabs-ssi/did-method-key';
// import {
//   CredentialFormatType,
//   CredentialProcessor,
//   ICredential,
//   JsonLdHandler,
//   ProofPurpose,
//   ProofType,
//   VerificationResult,
// } from '@blockialabs/ssi-credentials';
// import * as console from 'node:console';
// import { CredentialIssuer } from '../CredentialIssuer.js';
// import { IssuerSessionManager } from '../services/IssuerSessionManager.js';
// import { JWTProofValidator } from '../services/JWTProofValidator.js';
// import { NonceStorage } from '../services/NonceStorage.js';
// import { SchemaVerifier } from '../services/SchemaVerifier.js';
// import { SessionInMemoryStorage } from '../services/SessionInMemoryStorage.js';
// import {
//   CredentialRequest,
//   CredentialResponse,
//   DeferredCredentialRequest,
//   NotificationRequest,
// } from '../types/index.js';
// import { VerificationMethodType } from '@blockialabs-ssi/did';
// import { secp256k1 } from '@noble/curves/secp256k1';
// import { SignatureProvider } from '@blockialabs-ssi/utils';

// /**
//  * Comprehensive demo of the credential issuer SDK
//  * Shows all scenarios of credential issuance flows with real cryptography
//  */
// async function runCredentialOfferDemo() {
//   console.log('🔐 Starting Credential Issuer SDK Demo with Real Cryptography');
//   console.log('==========================================================');

//   const issuerPrivateKey = secp256k1.utils.randomSecretKey();
//   const issuerPublicKeyRaw = secp256k1.getPublicKey(issuerPrivateKey);

//   const issuerPublicKey = Buffer.from(issuerPublicKeyRaw).toString('hex');

//   const holderPrivateKey = secp256k1.utils.randomSecretKey();
//   const holderPublicKeyRaw = secp256k1.getPublicKey(holderPrivateKey);

//   const holderPublicKey = Buffer.from(holderPublicKeyRaw).toString('hex');

//   // Setup DID resolution
//   const keyMethod = new KeyDIDMethod();

//   // Create DIDs using the key method
//   const issuerDid = await keyMethod.create({
//     publicKeyHex: issuerPublicKey,
//   });

//   const holderDid = await keyMethod.create({
//     publicKeyHex: holderPublicKey,
//   });

//   // Setup entities with real keys
//   const ISSUER_DID = issuerDid.did;
//   const HOLDER_DID = holderDid.did;

//   // Create separate signature providers for issuer and holder
//   console.log('\n📦 Setting up issuer and holder infrastructure...');
//   // Create separate signature providers for issuer and holder
//   const issuerSignatureProvider = new SignatureProvider(ISSUER_DID, {
//     privateKey: issuerPrivateKey,
//     publicKey: issuerPublicKeyRaw,
//   });

//   const holderSignatureProvider = new SignatureProvider(HOLDER_DID, {
//     privateKey: holderPrivateKey,
//     publicKey: holderPublicKeyRaw,
//   });

//   // Create DID resolver and register both public keys
//   const didResolver = new KeyDIDResolver(keyMethod);

//   const schemaValidator = new SchemaVerifier();
//   const jsonLdHandler = new JsonLdHandler();

//   // Create credential processor
//   const credentialProcessor = new CredentialProcessor({
//     didResolver,
//     schemaValidator,
//     formatHandlers: {
//       [CredentialFormatType.JSON_LD]: jsonLdHandler,
//     },
//     signatureProviders: {
//     },
//   });

//   // Initialize session storage
//   const sessionStorage = new SessionInMemoryStorage({ ttl: 300 }); // 5 minutes expiry
//   const nonceStorage = new NonceStorage();

//   // Setup proof validation with the JWT validator
//   const jwtProofValidator = new JWTProofValidator(didResolver);
//   const proofValidators = new Map();
//   proofValidators.set('jwt', jwtProofValidator);

//   // Initialize the issuer with configuration
//   console.log('\n🏢 Initializing credential issuer...');
//   const issuer = new CredentialIssuer(
//     {
//       credential_issuer: 'https://example.com',
//       credential_endpoint: 'https://example.com/credentials',
//       credential_configurations_supported: {
//         IdentityCredential: {
//           format: CredentialFormatType.JSON_LD,
//           credential_definition: {
//             'type': ['VerifiableCredential', 'IdentityCredential'],
//             '@context': ['https://www.w3.org/2018/credentials/v1'],
//           },
//           cryptographic_binding_methods_supported: ['did:example'],
//           credential_signing_alg_values_supported: ['ES256'],
//         },
//       },
//       display: [
//         {
//           name: 'Example Issuer',
//           locale: 'en-US',
//           logo: {
//             uri: 'https://example.com/logo.png',
//             alt_text: 'Example Issuer Logo',
//           },
//         },
//       ],
//     },
//     {
//       sessionManager: new IssuerSessionManager(sessionStorage, nonceStorage),
//       proofValidators: proofValidators,
//       credentialProcessor,
//     },
//   );

//   // SCENARIO 1: Create and process a basic credential offer
//   console.log('\n🔄 SCENARIO 1: Basic Credential Offer with Pre-Authorized Code');
//   console.log('----------------------------------------------------------');
//   let sessionId;
//   try {
//     // Create a credential offer with pre-authorized code and PIN
//     console.log('Creating credential offer...');

//     // Using the builder pattern
//     const offerResult = await issuer
//       .createCredentialOfferBuilder({
//         generateQR: true,
//         baseUrl: 'https://example-issuer.com',
//       })
//       .withCredentialTypes(['IdentityCredential'])
//       .withPreAuthorizedCode()
//       .withTxCode({ length: 6 })
//       .build();

//     console.log('✅ Credential offer created:');
//     console.log(`URI: ${offerResult.uri}`);
//     console.log(`QR code length: ${offerResult.qrCode?.length || 0} chars`);
//     console.log(`PIN: ${offerResult.pin}`);
//     console.log(`Pre-authorized code: ${offerResult.session.preAuthorizedCode}`);
//     console.log(`Session ID: ${offerResult.session.id}`);

//     sessionId = offerResult.session.id;
//     // Process notification from wallet
//     console.log('\nSimulating wallet notification...');
//     const notification: NotificationRequest = {
//       notification_id: offerResult.session.notificationId,
//       event: 'credential_accepted',
//     };

//     const updatedSession = await issuer.processNotification(
//       offerResult.session.preAuthorizedCode,
//       undefined,
//       notification,
//     );

//     console.log(
//       '✅ Session status updated:',
//       typeof updatedSession === 'object' && 'status' in updatedSession
//         ? updatedSession.status
//         : 'Error',
//     );
//   } catch (error) {
//     console.error(
//       '❌ Error in Scenario 1:',
//       error instanceof Error ? error.message : String(error),
//     );
//   }

//   // SCENARIO 1.1
//   console.log('\n🎫 SCENARIO 1.1: Token Request Flow with Pre-Authorized Code');
//   console.log('-----------------------------------------------------');
//   try {
//     if (!sessionId) {
//       throw new Error('No session ID found for token request');
//     }
//     // Get the session from the previous scenario
//     const session = await issuer.getSession(sessionId);
//     if (!session) {
//       throw new Error('Session not found');
//     }

//     // Create a token request
//     const tokenRequest = {
//       'grant_type': 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
//       'pre-authorized_code': session.preAuthorizedCode,
//       'tx_code': session.pin, // Include PIN from the offer
//       'client_id': 'test-client',
//     };

//     console.log('Creating token request...');
//     console.log('Pre-authorized code:', tokenRequest['pre-authorized_code']);

//     // Process token request using builder pattern
//     const tokenResponse = await issuer
//       .createTokenBuilder(issuerSignatureProvider)
//       .withPreAuthorizedCode(tokenRequest['pre-authorized_code'])
//       .withPinCode(tokenRequest.tx_code || '')
//       .withClientId(tokenRequest.client_id)
//       .build();

//     if ('error' in tokenResponse) {
//       throw new Error(`Token error: ${tokenResponse.error}`);
//     }

//     console.log('✅ Token response received:');
//     console.log('Access token:', tokenResponse.access_token);
//     console.log('Token type:', tokenResponse.token_type);
//     console.log('Expires in:', tokenResponse.expires_in);

//     console.log('Verifying token signature...');
//     const [headerB64, payloadB64, signatureB64] = tokenResponse.access_token.split('.');

//     // Verify token signature
//     const dataToVerify = `${headerB64}.${payloadB64}`;
//     const signature = Buffer.from(signatureB64, 'base64url').toString('base64');

//     const verificationMethod = {
//       id: `${ISSUER_DID}#controllerKey`,
//       controller: ISSUER_DID,
//       publicKeyHex: issuerPublicKey,
//     };

//     const isValid = await issuerSignatureProvider.verify(dataToVerify, signature, {
//       verificationMethod: verificationMethod,
//     });
//     if (!isValid) {
//       throw new Error('Token signature verification failed');
//     }
//   } catch (error) {
//     console.error('❌ Token request failed:', error instanceof Error ? error.message : error);
//   }

//   // SCENARIO 2: Deferred credential issuance flow with real holder signatures
//   console.log('\n🔄 SCENARIO 2: Deferred Credential Issuance Flow with Real Signatures');
//   console.log('----------------------------------------------------------------');
//   try {
//     // 1. Create sample credential
//     const sampleCredential: ICredential = {
//       '@context': ['https://www.w3.org/2018/credentials/v1'],
//       'id': 'http://example.edu/credentials/3732',
//       'type': ['VerifiableCredential', 'IdentityCredential'],
//       'issuer': ISSUER_DID,
//       'name': 'Identity Credential',
//       'description': 'Demo identity credential',
//       'validFrom': new Date().toISOString(),
//       'credentialSubject': {
//         id: HOLDER_DID,
//         name: 'Alice Smith',
//         email: 'alice@example.com',
//       },
//       'credentialSchema': {
//         id: 'https://example.org/schemas/identity.json',
//         type: 'JsonSchemaValidator2018',
//       },
//     };

//     if (!sessionId) {
//       throw new Error('No session ID found for deferred credential issuance');
//     }
//     const sessionForOffer = await issuer.getSession(sessionId);
//     if (!sessionForOffer) {
//       throw new Error('No session found for deferred credential issuance');
//     }

//     // 2. Create JWT payload for credential request
//     const requestNonceObject = await issuer.generateNonce({
//       preAuthorizedCode: sessionForOffer?.preAuthorizedCode,
//     });

//     // 3. Create a real JWT signed with holder's keys
//     const requestNonce = requestNonceObject.c_nonce;
//     const jwtPayload = {
//       iss: HOLDER_DID, // issuer of the JWT (the holder)
//       sub: HOLDER_DID, // subject of the JWT (the holder)
//       aud: 'https://example.com', // audience (the credential issuer)
//       nonce: requestNonce, // nonce for preventing replay attacks
//       iat: Math.floor(Date.now() / 1000),
//       exp: Math.floor(Date.now() / 1000) + 3600,
//     };

//     console.log("\nCreating real JWT for credential request using holder's keys...");
//     const jwtToken = await holderSignatureProvider.createJwt(jwtPayload);

//     console.log(`Real JWT token created by holder: ${jwtToken.substring(0, 20)}...`);

//     // 4. Create credential request with holder JWT proof
//     const credentialRequest: CredentialRequest = {
//       format: CredentialFormatType.JSON_LD,
//       proof: {
//         proof_type: 'jwt',
//         jwt: jwtToken,
//       },
//     };

//     console.log('\nSubmitting deferred credential request with holder JWT proof...');

//     const requestBuilder = issuer.createCredentialRequestBuilder({
//       responseCNonce: requestNonce,
//     });

//     requestBuilder.withCredentialRequest(credentialRequest);
//     requestBuilder.withCredential(sampleCredential);

//     const response: CredentialResponse = await requestBuilder.build();

//     console.log('✅ Credential request submitted with builder:');
//     console.log(`Transaction ID: ${response.transaction_id}`);

//     if (!response.transaction_id) {
//       throw new Error('No transaction ID returned');
//     }

//     // 6. Check credential status (should be pending)
//     console.log('\nChecking credential status...');
//     const request: DeferredCredentialRequest = {
//       transaction_id: response.transaction_id,
//     };

//     const statusResponse = await issuer.checkCredentialRequestStatus(request);
//     console.log('✅ Status response:', statusResponse.error || 'Ready for approval');

//     // SCENARIO 3 approve the credential
//     console.log('\n🔄 SCENARIO 3: Approving credential request with a real issuer signature');
//     console.log('--------------------------------------------');

//     const approvalBuilder = issuer.createApprovalBuilder(response.transaction_id);

//     if (!sessionId) {
//       throw new Error('No session ID found for deferred credential issuance');
//     }
//     const sessionForApproval = await issuer.getSession(sessionId);

//     if (!sessionForApproval?.pendingCredential) {
//       throw new Error('No pending credential found for approval');
//     }

//     // Generate a real signature from the issuer for the credential
//     const signedData = await issuerSignatureProvider.sign(
//       sessionForApproval.pendingCredential.canonicalForm,
//     );

//     approvalBuilder.withCompleteOptions({
//       verificationMethod: `${ISSUER_DID}#controllerKey`,
//       signature: signedData, // Real signature from issuer
//       proofPurpose: ProofPurpose.AssertionMethod,
//     });

//     const approveResponse = await approvalBuilder.build();

//     console.log('✅ Credential approved with real issuer signature:');
//     if (approveResponse.credentials) {
//       console.log(`Credential count: ${approveResponse.credentials.length}`);
//       console.log(`Notification ID: ${approveResponse.notification_id}`);

//       // Display the issued credential details
//       const issuedCredential = approveResponse.credentials[0];
//       console.log('\nIssued credential proof:');
//       if (issuedCredential?.credential?.proof) {
//         const proof = Array.isArray(issuedCredential.credential.proof)
//           ? issuedCredential.credential.proof[0]
//           : issuedCredential.credential.proof;

//         console.log(`Type: ${proof.type}`);
//         console.log(`Created: ${proof.created}`);
//         console.log(`Verification Method: ${proof.verificationMethod}`);
//         console.log(`Proof Value: ${proof.proofValue.substring(0, 30)}...`);
//       }
//     } else if (approveResponse.error) {
//       console.log(`Error: ${approveResponse.error}`);
//       console.log(`Description: ${approveResponse.error_description}`);
//     }
//   } catch (error) {
//     console.error(
//       '❌ Error in Scenario 2:',
//       error instanceof Error ? error.message : String(error),
//     );
//   }

//   // SCENARIO 4 retrieve the credential
//   console.log('\n🔄 SCENARIO 4: Retrieve the Issued Credential');
//   console.log('--------------------------------------------');
//   try {
//     // Retrieve the issued credential using the notification ID
//     if (!sessionId) {
//       throw new Error('No session ID found for deferred credential issuance');
//     }
//     const sessionForRetrieval = await issuer.getSession(sessionId);

//     if (!sessionForRetrieval?.transactionId) {
//       throw new Error('No transaction active');
//     }

//     // Retrieve the credential using the notification ID
//     const credentialResponse = await issuer.checkCredentialRequestStatus({
//       transaction_id: sessionForRetrieval.transactionId,
//     });

//     console.log(
//       `✅ Credential retrieved successfully: ${JSON.stringify(credentialResponse.credentials)}`,
//     );

//     if (
//       credentialResponse.credentials &&
//       credentialResponse.credentials.length &&
//       credentialResponse.credentials[0].credential
//     ) {
//       const verificationResult: VerificationResult = await credentialProcessor.verify(
//         credentialResponse.credentials[0].credential,
//         {},
//       );
//       console.log('Credential verification result:', verificationResult);
//     }
//   } catch (error) {
//     console.error(
//       '❌ Error in Scenario 3:',
//       error instanceof Error ? error.message : String(error),
//     );
//   }

//   // Cleanup resources
//   console.log('\n🧹 Cleaning up resources...');
//   if (
//     'stopCleanupRoutine' in sessionStorage &&
//     typeof sessionStorage.stopCleanupRoutine === 'function'
//   ) {
//     sessionStorage.stopCleanupRoutine();
//   }

//   console.log('✅ Demo completed successfully!');
// }

// // Run the demo with proper error handling
// runCredentialOfferDemo().catch((error) => {
//   console.error(
//     '\n❌ FATAL ERROR in credential demo:',
//     error instanceof Error ? error.message : String(error),
//   );
//   process.exit(1);
// });

// // Export for nx executor
// export default runCredentialOfferDemo;
