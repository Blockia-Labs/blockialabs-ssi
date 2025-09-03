import { JsonWebKey } from 'crypto';
import { ConditionWeightedThreshold } from './IConditionWeightedThreshold.js';
import { VerificationMethodType } from '../../constants/VerificationMethodType.js';

/**
 * @file Defines the IVerificationMethod interface, representing a verification method used in DID documents.
 * @module IVerificationMethod
 */

/**
 * Represents a verification method, which specifies how the DID subject can be verified.
 * This includes the type of key or algorithm used for verification, as well as the public key
 * or other information needed to perform the verification.
 *
 * @interface IVerificationMethod
 */
export interface IVerificationMethod {
  /**
   * Identifier for the verification method.
   *
   * @type {string}
   * @description This MUST conform to DID URL syntax.
   * @example "did:example:123#key-1"
   */
  id: string;

  /**
   * Type of verification method.
   *
   * @type {VerificationMethodType}
   * @description This MUST be a value from the {@link VerificationMethodType} enum,
   * indicating the type of key or algorithm used for verification.
   * @example "JsonWebKey2020"
   */
  type: VerificationMethodType;

  /**
   * DID of the controller of this verification method.
   *
   * @type {string}
   * @description This MUST conform to DID syntax and identifies the entity
   * that controls the verification method.
   * @example "did:example:123"
   */
  controller: string;

  /**
   * Public key in JWK format.
   *
   * @type {JsonWebKey | undefined}
   * @description Used by verification methods such as JsonWebKey2020.
   * @optional
   */
  publicKeyJwk?: JsonWebKey;

  /**
   * Public key in hex format.
   *
   * @type {string | undefined}
   * @description Used for recovery functions.
   * @optional
   * @deprecated This property is deprecated in favor of `publicKeyMultibase` or `publicKeyJwk`.
   * It's included for legacy compatibility but should not be used for newly defined suites.
   */
  publicKeyHex?: string;

  /**
   * Public key in multibase format.
   *
   * @type {string | undefined}
   * @description Used by verification methods such as EcdsaSecp256k1Signature2019.
   * @optional
   */
  publicKeyMultibase?: string;

  /**
   * Public key in base58 format.
   *
   * @type {string | undefined}
   * @description Used by older verification method types.
   * @optional
   * @deprecated This property is deprecated in favor of `publicKeyMultibase` or `publicKeyJwk`.
   * It's included for legacy compatibility but should not be used for newly defined suites.
   */
  publicKeyBase58?: string;

  /**
   * Public key in base64 format.
   *
   * @type {string | undefined}
   * @description Used by some verification methods.
   * @optional
   */
  publicKeyBase64?: string;

  /**
   * PGP Public Key.
   *
   * @type {string | undefined}
   * @description Used by PgpVerificationKey2021.
   * @optional
   */
  publicKeyPgp?: string;

  /**
   * Blockchain account identifier.
   *
   * @type {string | undefined}
   * @description Used by verification methods such as EcdsaSecp256k1RecoveryMethod2020.
   * @optional
   */
  blockchainAccountId?: string;

  /**
   * Conditions where all must be valid or all must be false.
   *
   * @type {IVerificationMethod[] | undefined}
   * @description Logical AND condition for verification methods.
   * @optional
   */
  conditionAnd?: IVerificationMethod[];

  /**
   * Conditions where at least one must be true.
   *
   * @type {IVerificationMethod[] | undefined}
   * @description Logical OR condition for verification methods.
   * @optional
   */
  conditionOr?: IVerificationMethod[];

  /**
   * Threshold value for conditional proofs.
   *
   * @type {number | undefined}
   * @description Used in threshold-based conditions.
   * @optional
   */
  threshold?: number;

  /**
   * Conditions for threshold-based verification.
   *
   * @type {IVerificationMethod[] | undefined}
   * @description List of verification methods for threshold-based conditions.
   * @optional
   */
  conditionThreshold?: IVerificationMethod[];

  /**
   * Conditions for weighted threshold-based verification.
   *
   * @type {ConditionWeightedThreshold[] | undefined}
   * @description List of weighted threshold conditions.
   * @optional
   */
  conditionWeightedThreshold?: ConditionWeightedThreshold[];

  /**
   * Delegated condition.
   *
   * @type {string | undefined}
   * @description A delegated condition for verification.
   * @optional
   */
  conditionDelegated?: string;

  /**
   * Parent relationships.
   *
   * @type {string[] | undefined}
   * @description List of parent relationships.
   * @optional
   */
  relationshipParent?: string[];

  /**
   * Child relationships.
   *
   * @type {string[] | undefined}
   * @description List of child relationships.
   * @optional
   */
  relationshipChild?: string[];

  /**
   * Sibling relationships.
   *
   * @type {string[] | undefined}
   * @description List of sibling relationships.
   * @optional
   */
  relationshipSibling?: string[];
}
