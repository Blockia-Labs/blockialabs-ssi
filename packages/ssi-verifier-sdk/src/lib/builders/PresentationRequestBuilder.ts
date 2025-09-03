import { IStorage } from '@blockialabs/ssi-storage';
import { v4 as uuidv4 } from 'uuid';
import { ValidationUtils } from '../utils/ValidationUtils.js';
import {
  FormatDefinition,
  SubmissionRequirement,
  PresentationDefinition,
  InputDescriptor,
  Constraints,
} from '../types/PresentationDefinition.js';

/**
 * Builder for creating presentation definitions
 */
export class PresentationRequestBuilder {
  private id: string;
  private name?: string;
  private purpose?: string;
  private credentialTypes: string[] = [];
  private proofTypes: string[] = [];
  private constraints: any[] = [];
  private format?: FormatDefinition;
  private submissionRequirements: SubmissionRequirement[] = [];

  private storage?: IStorage<PresentationDefinition>;

  /**
   * Create a new presentation request builder
   */
  constructor(storage: IStorage<PresentationDefinition>) {
    this.id = uuidv4();
    this.storage = storage;
  }

  /**
   * Set the identifier for the presentation definition
   * @param id Identifier
   */
  withId(id?: string): this {
    if (id) {
      this.id = id;
    }
    return this;
  }

  /**
   * Set the name of the presentation definition
   * @param name Human-readable name
   */
  withName(name: string): this {
    this.name = ValidationUtils.validateRequired(name, 'name');
    return this;
  }

  /**
   * Set the purpose of the presentation definition
   * @param purpose Human-readable purpose
   */
  withPurpose(purpose: string): this {
    this.purpose = ValidationUtils.validateRequired(purpose, 'purpose');
    return this;
  }

  /**
   * Add credential types that should be requested
   * @param types Array of credential types
   */
  withCredentialTypes(types: string[]): this {
    this.credentialTypes = [...new Set([...this.credentialTypes, ...types])];
    return this;
  }

  /**
   * Add proof types that should be accepted
   * @param types Array of proof types
   */
  withProofTypes(types: string[]): this {
    this.proofTypes = [...new Set([...this.proofTypes, ...types])];
    return this;
  }

  /**
   * Add custom constraints for credential selection
   * @param constraints Array of constraint objects
   */
  withConstraints(constraints: any[]): this {
    this.constraints = [...this.constraints, ...constraints];
    return this;
  }

  /**
   * Set the format requirements for credentials
   * @param format Format definition
   */
  withFormat(format: FormatDefinition): this {
    this.format = format;
    return this;
  }

  /**
   * Set submission requirements for credential presentation
   * @param requirements Array of submission requirements
   */
  withSubmissionRequirements(requirements: SubmissionRequirement[]): this {
    this.submissionRequirements = requirements;
    return this;
  }

  /**
   * Build the presentation definition
   * @returns Complete presentation definition
   */
  public async build(): Promise<PresentationDefinition> {
    // Create base presentation definition
    const presentationDefinition: PresentationDefinition = {
      id: this.id,
      input_descriptors: [],
    };

    // Add optional properties
    if (this.name) {
      presentationDefinition.name = this.name;
    }

    if (this.purpose) {
      presentationDefinition.purpose = this.purpose;
    }

    if (Object.keys(this.format || {}).length > 0) {
      presentationDefinition.format = this.format;
    }

    if (this.submissionRequirements.length > 0) {
      presentationDefinition.submission_requirements = this.submissionRequirements;
    }

    // Create the default input descriptor
    const defaultInputDescriptor: InputDescriptor = {
      id: `${this.id}-input-1`,
      constraints: this.buildConstraints(),
    };

    // Add format for proof types if specified
    if (this.proofTypes.length > 0) {
      defaultInputDescriptor.format = {
        ldp_vp: {
          proof_type: this.proofTypes,
        },
        ldp_vc: {
          proof_type: this.proofTypes,
        },
      };
    }

    // Add the default input descriptor
    presentationDefinition.input_descriptors.push(defaultInputDescriptor);

    // Add any additional custom input descriptors from constraints
    for (const constraint of this.constraints) {
      if (constraint.input_descriptor) {
        presentationDefinition.input_descriptors.push(constraint.input_descriptor);
      }
    }

    // Store the presentation definition in storage if provided
    if (this.storage) {
      await this.storage.set(this.id, presentationDefinition);
    }

    return presentationDefinition;
  }

  /**
   * Build constraints from credential types and custom constraints
   */
  private buildConstraints(): Constraints {
    // Start with basic constraints
    const constraints: Constraints = {
      fields: [],
    };

    // Add credential type constraints if provided
    if (this.credentialTypes.length > 0) {
      constraints.fields = [
        {
          path: ['$.type'],
          filter: {
            type: 'array',
            contains: {
              type: 'string',
              enum: this.credentialTypes,
            },
          },
        },
      ];
    }

    // Add custom field constraints
    for (const constraint of this.constraints) {
      if (constraint.field) {
        constraints.fields = [...(constraints.fields || []), constraint.field];
      }
    }

    return constraints;
  }
}
