import { IVerificationMethod } from './IVerificationMethod.js';

/**
 * Represents a weighted threshold condition.
 *
 * @interface ConditionWeightedThreshold
 */
export interface ConditionWeightedThreshold {
  /**
   * The verification method for this condition.
   *
   * @type {IVerificationMethod}
   */
  verificationMethod: IVerificationMethod;

  /**
   * The weight of this condition.
   *
   * @type {number}
   */
  weight: number;
}
