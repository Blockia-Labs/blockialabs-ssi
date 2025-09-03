import { IDIDResolver } from '@blockialabs/ssi-did';
import { IVerifiablePresentation, ClaimWithMetadata } from '../types/ClaimTypes.js';
import { VerificationOptions } from '../types/PresentationResponse.js';
import { VerificationResult, CredentialProcessor } from '@blockialabs/ssi-credentials';
import { VpProofValidator } from './VpProofValidator.js';

/**
 * Enhanced verification result with multiple errors
 */
export interface EnhancedVerificationResult extends VerificationResult {
  errors?: string[];
}

/**
 * Utility class for validating presentation responses
 */
export class ResponseValidator {
  /**
   * Decode a VP token from various formats (JSON, JWT, etc.)
   * @param vpToken The VP token to decode (string or object)
   * @returns The decoded VP token as an object
   */
  static decodeVpToken(vpToken: string | object): IVerifiablePresentation {
    // If vpToken is already an object, return it
    if (typeof vpToken !== 'string') {
      return vpToken as IVerifiablePresentation;
    }

    // Try to parse as JSON first
    try {
      return JSON.parse(vpToken);
    } catch (error) {
      // Not a JSON string, try to decode as JWT
      try {
        const parts = vpToken.split('.');
        if (parts.length === 3) {
          // This is a JWT format
          const payloadBase64 = parts[1];
          // Ensure proper base64url padding for decoding
          const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

          // Decode the payload
          const payloadJson = Buffer.from(padded, 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);

          // If payload contains VP data, return it
          if (payload.vp) {
            return payload.vp;
          }

          // If payload itself is a VP, return payload
          if (
            payload.verifiableCredential ||
            (payload['@context'] && payload.type && payload.type.includes('VerifiablePresentation'))
          ) {
            return payload;
          }

          throw new Error('JWT payload does not contain a valid VP');
        }
      } catch (jwtError) {
        // Failed to decode as JWT
        throw new Error(
          `Failed to decode VP token: ${
            jwtError instanceof Error ? jwtError.message : String(jwtError)
          }`,
        );
      }

      // Neither JSON nor valid JWT
      throw new Error('VP token format not recognized (not valid JSON or JWT)');
    }
  }

  /**
   * Validate a VP token
   * @param credentialProcessor The credential processor for verifying signatures
   * @param didResolver The DID resolver for resolving verification methods
   * @param vpToken The VP token to validate
   * @param presentationSubmission The presentation submission metadata
   * @param options Verification options
   * @returns Verification result with all errors collected
   */
  static async validateVpToken(
    credentialProcessor: CredentialProcessor,
    didResolver: IDIDResolver,
    vpToken: any,
    presentationSubmission: any,
    options: VerificationOptions,
  ): Promise<EnhancedVerificationResult> {
    try {
      // Collection of all validation errors
      const errors: string[] = [];

      // Decode the VP token if it's a string (JSON, JWT, etc.)
      let decodedVpToken;
      try {
        decodedVpToken = ResponseValidator.decodeVpToken(vpToken);
      } catch (error) {
        return {
          valid: false,
          reason: `Invalid VP token format: ${
            error instanceof Error ? error.message : String(error)
          }`,
          errors: [
            `Invalid VP token format: ${error instanceof Error ? error.message : String(error)}`,
          ],
        };
      }

      // Basic structure validation
      if (!decodedVpToken || typeof decodedVpToken !== 'object') {
        return {
          valid: false,
          reason: 'Invalid VP token format',
          errors: ['Invalid VP token format'],
        };
      }

      if (!presentationSubmission) {
        errors.push('Invalid presentation submission format');
      }

      // Check if VP token has required properties for OpenID4VP
      if (!decodedVpToken.verifiableCredential && !decodedVpToken.proof) {
        errors.push('VP token must contain verifiableCredential or PROOF property');
      }

      // Check for required OpenID4VP context
      const contexts = decodedVpToken['@context'];
      if (
        !contexts ||
        !Array.isArray(contexts) ||
        !contexts.includes('https://www.w3.org/2018/credentials/v1')
      ) {
        errors.push('VP token missing required W3C Verifiable Credentials context');
      }

      // Validate the presentation type
      if (
        !decodedVpToken.type ||
        !Array.isArray(decodedVpToken.type) ||
        !decodedVpToken.type.includes('VerifiablePresentation')
      ) {
        errors.push('VP token must have VerifiablePresentation type');
      }

      // Match presentation submission with credentials if we have a valid submission
      if (presentationSubmission && presentationSubmission.descriptor_map) {
        const validSubmission = ResponseValidator.validatePresentationSubmission(
          decodedVpToken,
          presentationSubmission,
        );

        if (!validSubmission.valid) {
          // Include detailed submission errors if available
          if (validSubmission.errors && validSubmission.errors.length > 0) {
            errors.push(...validSubmission.errors);
          }
        }
      }

      // Check if we have errors before proceeding with cryptographic validation
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0], // Main reason is the first error
          errors: errors,
        };
      }

      // VERIFY THE PRESENTATION PROOF (VP proof)
      const vpProofValidator = new VpProofValidator(
        didResolver,
        credentialProcessor.getSignatureProviders(),
      );

      const vpVerificationResult = await vpProofValidator.verifyProof(decodedVpToken, options);

      if (!vpVerificationResult.valid) {
        // Include detailed VP proof errors if available
        if (vpVerificationResult.errors && vpVerificationResult.errors.length > 0) {
          errors.push(...vpVerificationResult.errors);
        }
      }

      // VERIFY ALL CONTAINED CREDENTIALS, even if VP proof failed
      const credentialVerificationResult = await ResponseValidator.verifyAllCredentials(
        credentialProcessor,
        decodedVpToken,
        options,
      );

      if (!credentialVerificationResult.valid) {
        // Include detailed credential errors if available
        if (credentialVerificationResult.errors && credentialVerificationResult.errors.length > 0) {
          errors.push(...credentialVerificationResult.errors);
        }
      }

      // Overall validation result
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0], // Main reason is the first error
          errors: errors,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Unknown validation error',
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }

  /**
   * Verify all credentials within a VP token
   * @param credentialProcessor The credential processor for verification
   * @param vpToken The VP token containing credentials to verify
   * @param options Verification options
   * @returns Verification result with all credential errors collected
   */
  private static async verifyAllCredentials(
    credentialProcessor: CredentialProcessor,
    vpToken: any,
    options: VerificationOptions,
  ): Promise<EnhancedVerificationResult> {
    const errors: string[] = [];

    try {
      // Get credentials array from VP token
      const credentials = vpToken.verifiableCredential || [];

      if (!Array.isArray(credentials) || credentials.length === 0) {
        return {
          valid: false,
          reason: 'No verifiable credentials found in VP token',
          errors: ['No verifiable credentials found in VP token'],
        };
      }

      // Verify each credential and collect all errors
      for (let i = 0; i < credentials.length; i++) {
        const credential = credentials[i];
        const credErrors: string[] = [];

        // Verify credential has required fields
        if (!credential['@context']) {
          credErrors.push(`Credential at index ${i} missing required @context field`);
        }

        if (!credential.type) {
          credErrors.push(`Credential at index ${i} missing required type field`);
        }

        if (!credential.issuer) {
          credErrors.push(`Credential at index ${i} missing required issuer field`);
        }

        // Verify credential has a proof
        if (!credential.proof) {
          credErrors.push(`Credential at index ${i} has no proof`);
        }

        // Verify credential is not expired if requested
        if (credential.expirationDate) {
          const expirationDate = new Date(credential.expirationDate);
          if (expirationDate < new Date()) {
            credErrors.push(`Credential at index ${i} expired on ${expirationDate.toISOString()}`);
          }
        }

        // Check credential status if requested
        if (credential.credentialStatus) {
          // TODO call revocation registry to check status
          credErrors.push(
            `Credential status checking requested but not implemented for credential at index ${i}`,
          );
        }

        // Skip cryptographic verification if we already found errors
        if (credErrors.length === 0 && credential.proof) {
          try {
            // Verify cryptographic proof using the credential processor
            const verificationResult = await credentialProcessor.verify(credential, {
              challenge: options.challenge,
            });

            if (!verificationResult.valid) {
              credErrors.push(
                `Credential at index ${i} verification failed: ${verificationResult.reason}`,
              );
            }
          } catch (error) {
            credErrors.push(
              `Error verifying credential at index ${i}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }

        // Check that the credential subject id matches the VP holder if both are present
        if (
          credential.credentialSubject?.id &&
          vpToken.holder &&
          credential.credentialSubject.id !== vpToken.holder
        ) {
          // Optional check, only add as error if explicitly requested
          credErrors.push(
            `Credential at index ${i} subject id (${credential.credentialSubject.id}) does not match VP holder (${vpToken.holder})`,
          );
        }

        // Add all errors from this credential to the overall errors list
        if (credErrors.length > 0) {
          errors.push(...credErrors);
        }
      }

      // Return the combined verification result
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0], // First error as the main reason
          errors: errors,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Credential verification failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        errors: [
          `Credential verification failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }

  /**
   * Validate the presentation submission matches the presentation definition
   * and that the submitted credentials align with the submission descriptor map
   *
   * @param vpToken The VP token with credentials
   * @param presentationSubmission The presentation submission metadata
   * @returns Validation result with all submission errors collected
   */
  private static validatePresentationSubmission(
    vpToken: any,
    presentationSubmission: any,
  ): EnhancedVerificationResult {
    const errors: string[] = [];

    try {
      // Check for required fields in presentation submission
      if (!presentationSubmission.id) {
        errors.push('Presentation submission missing required id');
      }

      if (!presentationSubmission.definition_id) {
        errors.push('Presentation submission missing required definition_id');
      }

      // Get credentials array from VP token
      const credentials =
        vpToken.verifiableCredential || (vpToken.vp && vpToken.vp.verifiableCredential) || [];

      if (!Array.isArray(credentials) || credentials.length === 0) {
        errors.push('No verifiable credentials found in VP token');
      }

      // Check that all descriptor paths resolve to actual credentials
      const descriptorMap = presentationSubmission.descriptor_map;

      if (!Array.isArray(descriptorMap)) {
        errors.push('Presentation submission descriptor_map must be an array');
      } else {
        for (let i = 0; i < descriptorMap.length; i++) {
          const descriptor = descriptorMap[i];

          // Verify descriptor has required properties
          if (!descriptor.id) {
            errors.push(`Descriptor at index ${i} missing required id field`);
          }

          if (!descriptor.path) {
            errors.push(`Descriptor at index ${i} missing required path field`);
          }

          if (!descriptor.format) {
            errors.push(`Descriptor at index ${i} missing required format field`);
          }

          // Skip path validation if path is missing
          if (descriptor.path) {
            // Verify the path actually resolves to a credential in the VP token
            const pathParts = descriptor.path.split('.');
            if (pathParts[0] !== '$') {
              errors.push(`Invalid descriptor path format at index ${i}: ${descriptor.path}`);
            } else if (pathParts.length > 1) {
              // Handle different path formats for presentation submissions
              const indexMatch = pathParts[1].match(/verifiableCredential\[(\d+)\]/);
              if (indexMatch && indexMatch[1]) {
                const index = parseInt(indexMatch[1]);
                if (index >= credentials.length) {
                  errors.push(
                    `Descriptor at index ${i} references non-existent credential at index ${index}`,
                  );
                } else if (descriptor.format && credentials[index]) {
                  // Verify credential format matches format in descriptor
                  const credential = credentials[index];
                  if (
                    descriptor.format === 'ldp_vc' &&
                    (!credential['@context'] || !Array.isArray(credential['@context']))
                  ) {
                    errors.push(
                      `Credential at index ${index} does not match expected format ${descriptor.format}`,
                    );
                  }

                  if (descriptor.format === 'jwt_vc' && typeof credential !== 'string') {
                    errors.push(
                      `Credential at index ${index} does not match expected format ${descriptor.format}`,
                    );
                  }
                }
              }
            }
          }
        }
      }

      // Return the validation result with all errors
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0], // First error as main reason
          errors: errors,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Error validating presentation submission: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        errors: [
          `Error validating presentation submission: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        ],
      };
    }
  }

  /**
   * Verify a presentation
   * @param credentialProcessor The credential processor for verification
   * @param didResolver The DID resolver for verification methods
   * @param presentation The presentation to verify
   * @param options Verification options
   * @returns Verification result with all errors collected
   */
  static async verify(
    credentialProcessor: CredentialProcessor,
    didResolver: IDIDResolver,
    presentation: any,
    options: VerificationOptions = {},
  ): Promise<EnhancedVerificationResult> {
    const errors: string[] = [];

    try {
      // Properly decode the presentation if it's in string format (JSON or JWT)
      let decodedPresentation;

      // Handle string-based presentations (JSON or JWT format)
      if (typeof presentation === 'string') {
        try {
          decodedPresentation = ResponseValidator.decodeVpToken(presentation);
        } catch (error) {
          return {
            valid: false,
            reason: `Failed to decode presentation: ${
              error instanceof Error ? error.message : String(error)
            }`,
            errors: [
              `Failed to decode presentation: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ],
          };
        }
      } else {
        decodedPresentation = presentation;
      }

      // Verify the VP structure has all required fields
      if (!decodedPresentation['@context']) {
        errors.push('VP missing required @context field');
      }

      if (!decodedPresentation.type) {
        errors.push('VP missing required type field');
      }

      if (!decodedPresentation.verifiableCredential) {
        errors.push('VP missing required verifiableCredential field');
      }

      // Verify required context includes W3C VC context
      const hasVCContext =
        Array.isArray(decodedPresentation['@context']) &&
        decodedPresentation['@context'].includes('https://www.w3.org/2018/credentials/v1');

      if (!hasVCContext) {
        errors.push('VP missing required W3C Verifiable Credentials context');
      }

      // Verify required type includes VerifiablePresentation
      const hasVPType =
        Array.isArray(decodedPresentation.type) &&
        decodedPresentation.type.includes('VerifiablePresentation');

      if (!hasVPType) {
        errors.push('VP missing required VerifiablePresentation type');
      }

      // Skip further verification if basic structure is invalid
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0], // First error as main reason
          errors: errors,
        };
      }

      // Initialize VP proof validator
      const vpProofValidator = new VpProofValidator(
        didResolver,
        credentialProcessor.getSignatureProviders(),
      );

      // Verify the presentation proof (collect errors but continue)
      const vpProofResult = await vpProofValidator.verifyProof(decodedPresentation, options);

      if (!vpProofResult.valid) {
        errors.push(vpProofResult.reason || 'VP proof verification failed');

        // Include detailed proof errors if available
        if (vpProofResult.errors && vpProofResult.errors.length > 0) {
          errors.push(...vpProofResult.errors);
        }
      }

      // Verify all contained credentials (collect errors but continue)
      const credentialsResult = await this.verifyAllCredentials(
        credentialProcessor,
        decodedPresentation,
        options,
      );

      if (!credentialsResult.valid) {
        errors.push(credentialsResult.reason || 'Credential verification failed');

        // Include detailed credential errors if available
        if (credentialsResult.errors && credentialsResult.errors.length > 0) {
          errors.push(...credentialsResult.errors);
        }
      }

      // Return final validation result with all collected errors
      if (errors.length > 0) {
        return {
          valid: false,
          reason: errors[0], // First error as main reason
          errors: errors,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: error instanceof Error ? error.message : 'Unknown verification error',
        errors: [error instanceof Error ? error.message : 'Unknown verification error'],
      };
    }
  }

  /**
   * Extract claims from a verified VP token
   * @param vpToken The verified VP token
   * @returns Array of claims with metadata
   */
  static extractClaims(vpToken: IVerifiablePresentation | string): ClaimWithMetadata[] {
    // Handle potential string input
    let decodedVpToken: IVerifiablePresentation;

    if (typeof vpToken === 'string') {
      try {
        decodedVpToken = ResponseValidator.decodeVpToken(vpToken);
      } catch (error) {
        throw new Error(
          `Failed to decode VP token: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      decodedVpToken = vpToken;
    }

    const claims: ClaimWithMetadata[] = [];

    // Ensure VP token has verifiable credentials
    if (
      !decodedVpToken.verifiableCredential ||
      !Array.isArray(decodedVpToken.verifiableCredential)
    ) {
      return claims;
    }

    // Extract claims from each credential
    for (const credential of decodedVpToken.verifiableCredential) {
      // Get credential subject claims
      const { id, ...subjectClaims } = credential.credentialSubject || {};

      // Create metadata from credential properties
      const metadata = {
        issuer: typeof credential.issuer === 'object' ? credential.issuer.id : credential.issuer,
        issuanceDate: credential.validFrom,
        expirationDate: credential.validUntil,
        type: Array.isArray(credential.type) ? credential.type : [credential.type].filter(Boolean),
        context: Array.isArray(credential['@context'])
          ? credential['@context'].map((ctx) =>
              typeof ctx === 'string' ? ctx : JSON.stringify(ctx),
            )
          : [
              typeof credential['@context'] === 'string'
                ? credential['@context']
                : JSON.stringify(credential['@context']),
            ].filter(Boolean),
      };

      claims.push({
        claim: subjectClaims,
        metadata: metadata,
      });
    }

    return claims;
  }

  /**
   * Check if a verified presentation has expired
   * @param vpToken The VP token to check
   * @returns True if any credential has expired, false otherwise
   */
  static hasExpired(vpToken: IVerifiablePresentation | string): boolean {
    // Handle potential string input
    let decodedVpToken: IVerifiablePresentation;

    if (typeof vpToken === 'string') {
      try {
        decodedVpToken = ResponseValidator.decodeVpToken(vpToken) as IVerifiablePresentation;
      } catch (error) {
        // If we can't decode it, conservatively say it's expired
        return true;
      }
    } else {
      decodedVpToken = vpToken;
    }

    const now = new Date();

    // Check credential expirations
    if (decodedVpToken.verifiableCredential && Array.isArray(decodedVpToken.verifiableCredential)) {
      for (const credential of decodedVpToken.verifiableCredential) {
        if (credential.validUntil && new Date(credential.validUntil) < now) {
          return true;
        }
      }
    }

    return false;
  }
}
