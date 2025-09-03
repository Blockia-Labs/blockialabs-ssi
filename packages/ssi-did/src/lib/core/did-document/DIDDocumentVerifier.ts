import { DIDStringValidator } from '../../core/did-string/DIDStringValidator.js';
import { IDIDDocument } from '../../interfaces/did-document/IDIDDocument.js';
import { IDIDDocumentVerificationResult } from '../../interfaces/operations/IDIDDocumentVerificationResult.js';
import { IProof } from '../../interfaces/did-document/IProof.js';
import { IService } from '../../interfaces/did-document/IService.js';
import { IVerificationMethod } from '../../interfaces/did-document/IVerificationMethod.js';

/**
 * @class DIDDocumentVerifier
 * @description Verifies DID documents according to W3C DID Core 1.0 specification
 */
export class DIDDocumentVerifier {
  /**
   * @method verify
   * @param {IDIDDocument} document - The DID document to verify
   * @returns {IDIDDocumentVerificationResult} The verification result
   * @description Performs comprehensive verification of a DID document
   */
  static verify(document: IDIDDocument): IDIDDocumentVerificationResult {
    const result: IDIDDocumentVerificationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Verify required core properties
    this.verifyRequiredProperties(document, result);

    // Verify DID syntax
    this.verifyDIDSyntax(document.id, result);

    // Verify context
    this.verifyContext(document['@context'], result);

    // Verify verification methods
    if (document.verificationMethod) {
      this.verifyVerificationMethods(document.verificationMethod, document.id, result);
    }

    // Verify verification relationships
    this.verifyVerificationRelationships(document, result);

    // Verify services
    if (document.service) {
      this.verifyServices(document.service, result);
    }

    // Verify proofs if present
    if (document.proof) {
      this.verifyProofStructure(document.proof, result);
    }

    // Check overall validity based on errors
    result.valid = result.errors.length === 0;

    return result;
  }

  /**
   * @private
   * @method verifyRequiredProperties
   * @param {IDIDDocument} document - The DID document to verify
   * @param {IDIDDocumentVerificationResult} result - The verification result to update
   * @description Verifies that the DID document has all required properties
   */
  private static verifyRequiredProperties(
    document: IDIDDocument,
    result: IDIDDocumentVerificationResult,
  ): void {
    if (!document.id) {
      result.errors.push('Missing required property: id');
    }

    if (!document['@context']) {
      result.errors.push('Missing required property: @context');
    }
  }

  /**
   * @private
   * @method verifyDIDSyntax
   * @param {string} did - The DID to verify
   * @param {IDIDDocumentVerificationResult} result - The verification result to update
   * @description Verifies that the DID follows the required syntax
   */
  private static verifyDIDSyntax(did: string, result: IDIDDocumentVerificationResult): void {
    if (!DIDStringValidator.isValidDID(did)) {
      result.errors.push(`Invalid DID: ${did}`);
    }
  }

  /**
   * @private
   * @method verifyContext
   * @param {string | string[] | (string | Record<string, unknown>)[]} context - The context to verify
   * @param {IDIDDocumentVerificationResult} result - The verification result to update
   * @description Verifies that the context includes the required DID v1 context
   */
  private static verifyContext(
    context: string | string[] | (string | Record<string, unknown>)[],
    result: IDIDDocumentVerificationResult,
  ): void {
    const hasDidV1Context = this.containsW3cDidV1Context(context);

    if (!hasDidV1Context) {
      result.errors.push('Missing required W3C DID v1 context (https://www.w3.org/ns/did/v1)');
    }
  }

  /**
   * @private
   * @method containsW3cDidV1Context
   * @param {string | string[] | (string | Record<string, unknown>)[]} context - The context to check
   * @returns {boolean} Whether the context includes the W3C DID v1 context
   * @description Checks if the provided context includes the required W3C DID v1 context
   */
  private static containsW3cDidV1Context(
    context: string | string[] | (string | Record<string, unknown>)[],
  ): boolean {
    const didV1Context = 'https://www.w3.org/ns/did/v1';

    if (typeof context === 'string') {
      return context === didV1Context;
    }

    if (Array.isArray(context)) {
      return context.some((item) => {
        if (typeof item === 'string') {
          return item === didV1Context;
        }
        return false;
      });
    }

    return false;
  }

  /**
   * @private
   * @method verifyVerificationMethods
   * @param {IVerificationMethod[]} methods - The verification methods to verify
   * @param {string} documentDid - The DID of the document being verified
   * @param {IDIDDocumentVerificationResult} result - The verification result to update
   * @description Verifies the structure and validity of verification methods
   */
  private static verifyVerificationMethods(
    methods: IVerificationMethod[],
    documentDid: string,
    result: IDIDDocumentVerificationResult,
  ): void {
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];

      // Check required fields
      if (!method.id) {
        result.errors.push(`Verification method at index ${i} is missing required 'id' property`);
      }

      if (!method.type) {
        result.errors.push(`Verification method at index ${i} is missing required 'type' property`);
      }

      if (!method.controller) {
        result.errors.push(
          `Verification method at index ${i} is missing required 'controller' property`,
        );
      } else {
        // Verify controller is a valid DID
        this.verifyDIDSyntax(method.controller, result);
      }

      // Check for deprecated properties
      if (method.publicKeyHex) {
        result.warnings.push(
          `Verification method at index ${i} uses deprecated 'publicKeyHex'. Consider using 'publicKeyMultibase' or 'publicKeyJwk' instead.`,
        );
      }

      if (method.publicKeyBase58) {
        result.warnings.push(
          `Verification method at index ${i} uses deprecated 'publicKeyBase58'. Consider using 'publicKeyMultibase' or 'publicKeyJwk' instead.`,
        );
      }

      // Verify at least one key material property exists (including deprecated ones for compatibility)
      const hasKeyMaterial =
        method.publicKeyJwk ||
        method.publicKeyMultibase ||
        method.publicKeyPgp ||
        method.publicKeyHex ||
        method.publicKeyBase58 ||
        method.blockchainAccountId;

      if (!hasKeyMaterial) {
        result.errors.push(
          `Verification method at index ${i} is missing key material (publicKeyJwk, publicKeyMultibase, etc.)`,
        );
      }

      // Check for multiple key representations (should have only one)
      // Include both current and deprecated properties
      const keyProps = [
        'publicKeyJwk',
        'publicKeyMultibase',
        'publicKeyPgp',
        'publicKeyHex',
        'publicKeyBase58',
        'blockchainAccountId',
        'ethereumAddress',
      ];

      const presentKeyProps = keyProps.filter((prop) => method[prop as keyof IVerificationMethod]);

      // Blockchain properties can be used together, so we need to handle them specially
      const blockchainProps = ['blockchainAccountId', 'ethereumAddress'];
      const presentBlockchainProps = blockchainProps.filter(
        (prop) => method[prop as keyof IVerificationMethod],
      );
      const presentNonBlockchainProps = presentKeyProps.filter(
        (prop) => !blockchainProps.includes(prop),
      );

      // Allow one non-blockchain property and optionally blockchain properties
      if (presentNonBlockchainProps.length > 1) {
        result.errors.push(
          `Verification method at index ${i} has multiple key material representations: ${presentNonBlockchainProps.join(
            ', ',
          )}`,
        );
      }

      // Check if blockchain properties are used with other key material
      if (presentBlockchainProps.length > 0 && presentNonBlockchainProps.length > 0) {
        result.warnings.push(
          `Verification method at index ${i} mixes blockchain identifiers (${presentBlockchainProps.join(
            ', ',
          )}) with other key material (${presentNonBlockchainProps.join(', ')})`,
        );
      }

      // A verification method ID can be the same as the document DID
      if (method.id && method.id !== documentDid && !method.id.startsWith(documentDid + '#')) {
        result.warnings.push(
          `Verification method ID '${method.id}' should be either the document DID or relative to it with a fragment '${documentDid}'`,
        );
      }
    }
  }

  /**
   * @private
   * @method verifyVerificationRelationships
   * @param {IDIDDocument} document - The DID document to verify
   * @param {IDIDDocumentVerificationResult} result - The verification result to update
   * @description Verifies the verification relationships (authentication, assertionMethod, etc.)
   */
  private static verifyVerificationRelationships(
    document: IDIDDocument,
    result: IDIDDocumentVerificationResult,
  ): void {
    const relationshipProperties = [
      'authentication',
      'assertionMethod',
      'keyAgreement',
      'capabilityInvocation',
      'capabilityDelegation',
    ];

    const verificationMethodIds = document.verificationMethod?.map((vm) => vm.id) || [];

    for (const property of relationshipProperties) {
      const relationships = document[property as keyof IDIDDocument] as
        | (IVerificationMethod | string)[]
        | undefined;

      if (!relationships) continue;

      for (let i = 0; i < relationships.length; i++) {
        const relationship = relationships[i];

        if (typeof relationship === 'string') {
          if (
            !relationship.startsWith(document.id + '#') &&
            !verificationMethodIds.includes(relationship)
          ) {
            result.warnings.push(
              `${property} at index ${i} references '${relationship}' which is not defined in the document's verificationMethod array`,
            );
          }
        } else {
          this.verifyVerificationMethods([relationship], document.id, result);
        }
      }
    }
  }

  /**
   * @private
   * @method verifyServices
   * @param {IService[]} services - The services to verify
   * @param {IDIDDocumentVerificationResult} result - The verification result to update
   * @description Verifies the structure and validity of services
   */
  private static verifyServices(
    services: IService[],
    result: IDIDDocumentVerificationResult,
  ): void {
    for (let i = 0; i < services.length; i++) {
      const service = services[i];

      if (!service.id) {
        result.errors.push(`Service at index ${i} is missing required 'id' property`);
      }

      if (!service.type) {
        result.errors.push(`Service at index ${i} is missing required 'type' property`);
      }

      if (!service.serviceEndpoint) {
        result.errors.push(`Service at index ${i} is missing required 'serviceEndpoint' property`);
      } else if (
        typeof service.serviceEndpoint !== 'string' &&
        !Array.isArray(service.serviceEndpoint) &&
        typeof service.serviceEndpoint !== 'object'
      ) {
        result.errors.push(
          `Service at index ${i} has invalid 'serviceEndpoint' - must be a string, array, or object`,
        );
      }
    }
  }

  /**
   * @private
   * @method verifyProofStructure
   * @param {IProof | IProof[]} proofs - The proofs to verify
   * @param {IDIDDocumentVerificationResult} result - The verification result to update
   * @description Verifies the structure of document proofs (not cryptographic verification)
   */
  private static verifyProofStructure(
    proofs: IProof | IProof[],
    result: IDIDDocumentVerificationResult,
  ): void {
    const proofArray = Array.isArray(proofs) ? proofs : [proofs];

    for (let i = 0; i < proofArray.length; i++) {
      const proof = proofArray[i];

      if (!proof.id) {
        result.errors.push(`Proof at index ${i} is missing required 'id' property`);
      }

      if (!proof.type) {
        result.errors.push(`Proof at index ${i} is missing required 'type' property`);
      }

      if (!proof.verificationMethod) {
        result.errors.push(`Proof at index ${i} is missing required 'verificationMethod' property`);
      }

      if (!proof.created) {
        result.errors.push(`Proof at index ${i} is missing required 'created' property`);
      } else {
        try {
          new Date(proof.created).toISOString();
        } catch {
          result.errors.push(`Proof at index ${i} has invalid 'created' date: ${proof.created}`);
        }
      }

      if (!proof.proofPurpose) {
        result.errors.push(`Proof at index ${i} is missing required 'proofPurpose' property`);
      }

      if (!proof.proofValue) {
        result.errors.push(`Proof at index ${i} is missing required 'proofValue' property`);
      }
    }
  }

  /**
   * @method cryptographicallyVerify
   * @param {IDIDDocument} document - The DID document to verify
   * @returns {Promise<IDIDDocumentVerificationResult>} The verification result
   * @description Cryptographically verifies a DID document's proof(s)
   * @todo Implement cryptographic verification using appropriate libraries
   */
  static async cryptographicallyVerify(
    document: IDIDDocument,
  ): Promise<IDIDDocumentVerificationResult> {
    const result = this.verify(document);

    if (!result.valid) {
      return result;
    }

    if (!document.proof) {
      result.warnings.push('Document does not contain any proofs to cryptographically verify');
      return result;
    }

    result.warnings.push('Cryptographic verification not implemented yet');

    return result;
  }
}
