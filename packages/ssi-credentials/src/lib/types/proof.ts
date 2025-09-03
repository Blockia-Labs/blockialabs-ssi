// Todo: Check W3C this should be 'jwt', 'ldp_vp', 'attestation'
export enum ProofType {
  EcdsaSecp256k1Signature2019 = 'EcdsaSecp256k1Signature2019',
  JsonWebSignature2020 = 'JsonWebSignature2020',
}

export enum ProofPurpose {
  Authentication = 'authentication',
  AssertionMethod = 'assertionMethod',
  KeyAgreement = 'keyAgreement',
  CapabilityDelegation = 'capabilityDelegation',
  CapabilityInvocation = 'capabilityInvocation',
}

export interface IProof {
  type: ProofType;
  created: string;
  verificationMethod: string;
  proofPurpose: ProofPurpose;
  proofValue: string;
  domain?: string;
  challenge?: string;
}
