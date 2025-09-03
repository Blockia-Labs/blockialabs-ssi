/**
 * Representation of a Presentation Definition as per DIF spec
 */
export interface PresentationDefinition {
  id: string;
  input_descriptors: InputDescriptor[];
  name?: string;
  purpose?: string;
  format?: FormatDefinition;
  submission_requirements?: SubmissionRequirement[];
}

/**
 * Input descriptor for requested credentials
 */
export interface InputDescriptor {
  id: string;
  name?: string;
  purpose?: string;
  format?: FormatDefinition;
  constraints: Constraints;
  group?: string[];
}

/**
 * Format requirements for credentials
 */
export interface FormatDefinition {
  jwt?: FormatEntry;
  jwt_vc?: FormatEntry;
  jwt_vp?: FormatEntry;
  ldp?: FormatEntry;
  ldp_vc?: FormatEntry;
  ldp_vp?: FormatEntry;
}

/**
 * Entry for a specific format
 */
export interface FormatEntry {
  alg?: string[];
  proof_type?: string[];
}

/**
 * Constraints on credential selection
 */
export interface Constraints {
  limit_disclosure?: 'required' | 'preferred';
  statuses?: StatusConstraints;
  fields?: FieldConstraint[];
  subject_is_issuer?: 'required' | 'preferred';
  is_holder?: HolderConstraint[];
  same_subject?: SameSubjectConstraint[];
}

/**
 * Status constraints for credential selection
 */
export interface StatusConstraints {
  active?: StatusConstraint;
  suspended?: StatusConstraint;
  revoked?: StatusConstraint;
}

/**
 * Status constraint definition
 */
export interface StatusConstraint {
  directive: 'required' | 'allowed' | 'disallowed';
}

/**
 * Field constraint for credential selection
 */
export interface FieldConstraint {
  path: string[];
  id?: string;
  purpose?: string;
  filter?: any; // JSON schema filter
  predicate?: 'required' | 'preferred';
}

/**
 * Holder constraint
 */
export interface HolderConstraint {
  directive: 'required' | 'preferred';
  field_id: string[];
}

/**
 * Same subject constraint
 */
export interface SameSubjectConstraint {
  directive: 'required' | 'preferred';
  field_id: string[];
}

/**
 * Submission requirement
 */
export interface SubmissionRequirement {
  name?: string;
  purpose?: string;
  rule: 'all' | 'pick';
  count?: number;
  min?: number;
  max?: number;
  from?: string;
  from_nested?: SubmissionRequirement[];
}

/**
 * Options for creating presentation requests
 */
export interface PresentationRequestOptions {
  baseUrl?: string;
  clientId?: string;
}
