/* eslint-disable @typescript-eslint/no-explicit-any */
import { DIDDocumentBuilder } from '../../../core/did-document/DIDDocumentBuilder.js';
import { IDIDDocument } from '../../../interfaces/did-document/IDIDDocument.js';
import { ILinkedResource } from '../../../interfaces/did-document/ILinkedResource.js';
import { IProof } from '../../../interfaces/did-document/IProof.js';
import { IService } from '../../../interfaces/did-document/IService.js';
import { IVerificationMethod } from '../../../interfaces/did-document/IVerificationMethod.js';
import { ProofPurpose } from '../../../constants/ProofPurpose.js';
import { VerificationMethodType } from '../../../constants/VerificationMethodType.js';

describe('DIDDocumentBuilder', () => {
  it('should create a builder instance with default context and DID', () => {
    const did = 'did:example:123';
    const builder = DIDDocumentBuilder.create(did);
    const document = (builder as any).document as IDIDDocument;

    expect(document.id).toBe(did);
    expect(document['@context']).toBe('https://www.w3.org/ns/did/v1');
  });

  it('should set the context using withContext()', () => {
    const did = 'did:example:123';
    const builder = DIDDocumentBuilder.create(did).withContext('https://example.org/context');
    const document = (builder as any).document as IDIDDocument;

    expect(document['@context']).toBe('https://example.org/context');
  });

  it('should set the context using withContext() with an array', () => {
    const did = 'did:example:123';
    const contextArray = ['https://example.org/context1', 'https://example.org/context2'];
    const builder = DIDDocumentBuilder.create(did).withContext(contextArray);
    const document = (builder as any).document as IDIDDocument;

    expect(document['@context']).toEqual(contextArray);
  });

  it('should throw an error if withContext() is called with an empty context', () => {
    const did = 'did:example:123';
    expect(() => DIDDocumentBuilder.create(did).withContext('')).toThrow(
      'Context must be a non-empty string or array',
    );
    expect(() => DIDDocumentBuilder.create(did).withContext([])).toThrow(
      'Context must be a non-empty string or array',
    );
  });

  it('should set the DID using withId()', () => {
    const did = 'did:example:123';
    const newDid = 'did:example:456';
    const builder = DIDDocumentBuilder.create(did).withId(newDid);
    const document = (builder as any).document as IDIDDocument;

    expect(document.id).toBe(newDid);
  });

  it('should throw an error if withId() is called with an invalid DID', () => {
    const did = 'did:example:123';
    expect(() => DIDDocumentBuilder.create(did).withId('invalid-did')).toThrow(
      'Invalid DID format',
    );
    expect(() => DIDDocumentBuilder.create(did).withId('')).toThrow('Invalid DID format');
  });

  it('should set alsoKnownAs identifiers using withAlsoKnownAs()', () => {
    const did = 'did:example:123';
    const identifiers = ['https://example.com/id1', 'https://example.com/id2'];
    const builder = DIDDocumentBuilder.create(did).withAlsoKnownAs(identifiers);
    const document = (builder as any).document as IDIDDocument;

    expect(document.alsoKnownAs).toEqual(identifiers);
  });

  it('should throw an error if withAlsoKnownAs() is called with a non-array', () => {
    const did = 'did:example:123';
    expect(() => DIDDocumentBuilder.create(did).withAlsoKnownAs('not an array' as any)).toThrow(
      'AlsoKnownAs must be an array of strings',
    );
  });

  it('should set the controller using withController()', () => {
    const did = 'did:example:123';
    const controller = 'did:example:controller';
    const builder = DIDDocumentBuilder.create(did).withController(controller);
    const document = (builder as any).document as IDIDDocument;

    expect(document.controller).toBe(controller);
  });

  it('should set the controller using withController() with an array', () => {
    const did = 'did:example:123';
    const controller = ['did:example:controller1', 'did:example:controller2'];
    const builder = DIDDocumentBuilder.create(did).withController(controller);
    const document = (builder as any).document as IDIDDocument;

    expect(document.controller).toEqual(controller);
  });

  it('should set verification methods using withVerificationMethod()', () => {
    const did = 'did:example:123';
    const verificationMethods: IVerificationMethod[] = [
      {
        id: 'did:example:123#key-1',
        type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
        controller: did,
        publicKeyMultibase: 'z6MkapK4oTttBsgN5v3wY5e7vYwtpwi7WB7uV85VEyv8',
      },
    ];
    const builder = DIDDocumentBuilder.create(did).withVerificationMethod(verificationMethods);
    const document = (builder as any).document as IDIDDocument;

    expect(document.verificationMethod).toEqual(verificationMethods);
  });

  it('should set authentication methods using withAuthentication()', () => {
    const did = 'did:example:123';
    const authenticationMethods: (IVerificationMethod | string)[] = [
      'did:example:123#key-1',
      {
        id: 'did:example:123#key-2',
        type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
        controller: did,
        publicKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'MKBCTNIcKUSDii11ySs3526iDZ8yunk6rdG2KT+CvM8',
          y: '4Etl6SRW2YiLUrZrwj3n32vynjPXk3hrFk5lsu9AH_g',
        },
      },
    ];
    const builder = DIDDocumentBuilder.create(did).withAuthentication(authenticationMethods);
    const document = (builder as any).document as IDIDDocument;

    expect(document.authentication).toEqual(authenticationMethods);
  });

  it('should set assertion methods using withAssertionMethod()', () => {
    const did = 'did:example:123';
    const assertionMethods: (IVerificationMethod | string)[] = [
      'did:example:123#key-1',
      {
        id: 'did:example:123#key-2',
        type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
        controller: did,
        publicKeyJwk: {
          kty: 'EC',
          crv: 'P-256',
          x: 'MKBCTNIcKUSDii11ySs3526iDZ8yunk6rdG2KT+CvM8',
          y: '4Etl6SRW2YiLUrZrwj3n32vynjPXk3hrFk5lsu9AH_g',
        },
      },
    ];
    const builder = DIDDocumentBuilder.create(did).withAssertionMethod(assertionMethods);
    const document = (builder as any).document as IDIDDocument;

    expect(document.assertionMethod).toEqual(assertionMethods);
  });

  it('should set key agreement methods using withKeyAgreement()', () => {
    const did = 'did:example:123';
    const keyAgreementMethods: (IVerificationMethod | string)[] = [
      'did:example:123#key-1',
      {
        id: 'did:example:123#key-2',
        type: VerificationMethodType.X25519KeyAgreementKey2019,
        controller: did,
        publicKeyMultibase: 'z6MkapK4oTttBsgN5v3wY5e7vYwtpwi7WB7uV85VEyv8',
      },
    ];
    const builder = DIDDocumentBuilder.create(did).withKeyAgreement(keyAgreementMethods);
    const document = (builder as any).document as IDIDDocument;

    expect(document.keyAgreement).toEqual(keyAgreementMethods);
  });

  it('should set capability invocation methods using withCapabilityInvocation()', () => {
    const did = 'did:example:123';
    const capabilityInvocationMethods: (IVerificationMethod | string)[] = [
      'did:example:123#key-1',
      {
        id: 'did:example:123#key-2',
        type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
        controller: did,
        publicKeyMultibase: 'z6MkapK4oTttBsgN5v3wY5e7vYwtpwi7WB7uV85VEyv8',
      },
    ];
    const builder = DIDDocumentBuilder.create(did).withCapabilityInvocation(
      capabilityInvocationMethods,
    );
    const document = (builder as any).document as IDIDDocument;

    expect(document.capabilityInvocation).toEqual(capabilityInvocationMethods);
  });

  it('should set capability delegation methods using withCapabilityDelegation()', () => {
    const did = 'did:example:123';
    const capabilityDelegationMethods: (IVerificationMethod | string)[] = [
      'did:example:123#key-1',
      {
        id: 'did:example:123#key-2',
        type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
        controller: did,
        publicKeyMultibase: 'z6MkapK4oTttBsgN5v3wY5e7vYwtpwi7WB7uV85VEyv8',
      },
    ];
    const builder = DIDDocumentBuilder.create(did).withCapabilityDelegation(
      capabilityDelegationMethods,
    );
    const document = (builder as any).document as IDIDDocument;

    expect(document.capabilityDelegation).toEqual(capabilityDelegationMethods);
  });

  it('should set services using withServices()', () => {
    const did = 'did:example:123';
    const services: IService[] = [
      {
        id: 'did:example:123#service-1',
        type: 'LinkedDomains',
        serviceEndpoint: 'https://example.com',
      },
    ];
    const builder = DIDDocumentBuilder.create(did).withServices(services);
    const document = (builder as any).document as IDIDDocument;

    expect(document.service).toEqual(services);
  });

  it('should set linked resources using withLinkedResources()', () => {
    const did = 'did:example:123';
    const linkedResources: ILinkedResource[] = [
      { id: 'did:example:123#resource-1', type: 'image', resourceFormat: 'image/png' },
    ];
    const builder = DIDDocumentBuilder.create(did).withLinkedResources(linkedResources);
    const document = (builder as any).document as IDIDDocument;

    expect(document.linkedResource).toEqual(linkedResources);
  });

  it('should set proof using withProof()', () => {
    const did = 'did:example:123';
    const proof: IProof = {
      id: 'did:example:signer',
      type: 'EcdsaSecp256k1Signature2019',
      created: '2023-10-27T00:00:00Z',
      proofValue: 'test-signature',
      proofPurpose: ProofPurpose.Authentication,
      verificationMethod: 'did:example:signer#key-1',
    };
    const builder = DIDDocumentBuilder.create(did).withProof(proof);
    const document = (builder as any).document as IDIDDocument;

    expect(document.proof).toEqual(proof);
  });

  it('should set DNS validation domain using withDNSValidationDomain()', () => {
    const did = 'did:example:123';
    const domain = 'example.com';
    const builder = DIDDocumentBuilder.create(did).withDNSValidationDomain(domain);
    const document = (builder as any).document as IDIDDocument;

    expect(document.dnsValidationDomain).toBe(domain);
  });

  it('should build a valid DID document', () => {
    const did = 'did:example:123';
    const builder = DIDDocumentBuilder.create(did)
      .withContext('https://www.w3.org/ns/did/v1')
      .withAlsoKnownAs(['https://example.com/profile'])
      .withController('did:example:controller');

    const document: IDIDDocument = builder.build();

    expect(document.id).toBe(did);
    expect(document['@context']).toBe('https://www.w3.org/ns/did/v1');
    expect(document.alsoKnownAs).toEqual(['https://example.com/profile']);
    expect(document.controller).toBe('did:example:controller');
  });

  it('should throw an error if building without a DID', () => {
    const did = 'did:example:123';
    const builder = DIDDocumentBuilder.create(did);
    (builder as any).document.id = undefined;

    expect(() => builder.build()).toThrow(
      'Invalid DID Document: Missing required property: id; Invalid DID: undefined',
    );
  });

  it('should NOT freeze the DID document after regular build()', () => {
    const did = 'did:example:123';
    const builder = DIDDocumentBuilder.create(did);
    const document = builder.build();

    expect(() => {
      (document as any).newProperty = 'test';
    }).not.toThrow(); // Should NOT throw an error in strict mode

    expect((document as any).newProperty).toBe('test');
  });

  it('should freeze the DID document after buildAndSeal()', () => {
    const did = 'did:example:123';
    const builder = DIDDocumentBuilder.create(did);
    const document = builder.buildAndSeal();

    expect(() => {
      (document as any).newProperty = 'test';
    }).toThrow(); // Should throw an error in strict mode
  });

  it('should clone a builder instance correctly', () => {
    const did = 'did:example:123';
    const originalBuilder = DIDDocumentBuilder.create(did)
      .withContext('https://example.org/context')
      .withAlsoKnownAs(['https://example.com/profile']);

    const clonedBuilder = originalBuilder.clone();

    // Modify the cloned builder
    const newDid = 'did:example:456';
    clonedBuilder.withId(newDid);

    // Original builder should be unchanged
    const originalDoc = (originalBuilder as any).document as IDIDDocument;
    expect(originalDoc.id).toBe(did);

    // Cloned builder should have the modification
    const clonedDoc = (clonedBuilder as any).document as IDIDDocument;
    expect(clonedDoc.id).toBe(newDid);

    // But should have copied the rest
    expect(clonedDoc['@context']).toBe('https://example.org/context');
    expect(clonedDoc.alsoKnownAs).toEqual(['https://example.com/profile']);
  });

  it('should replace existing proof when using withProof()', () => {
    const did = 'did:example:123';
    const proof1: IProof = {
      id: 'did:example:signer1',
      type: 'EcdsaSecp256k1Signature2019',
      created: '2023-10-27T00:00:00Z',
      proofValue: 'test-signature-1',
      proofPurpose: ProofPurpose.Authentication,
      verificationMethod: 'did:example:signer1#key-1',
    };

    const proof2: IProof = {
      id: 'did:example:signer2',
      type: 'EcdsaSecp256k1Signature2019',
      created: '2023-10-28T00:00:00Z',
      proofValue: 'test-signature-2',
      proofPurpose: ProofPurpose.Authentication,
      verificationMethod: 'did:example:signer2#key-1',
    };

    const builder = DIDDocumentBuilder.create(did).withProof(proof1).withProof(proof2);

    const document = (builder as any).document as IDIDDocument;

    // Should have only proof2, as withProof replaces
    expect(document.proof).toEqual(proof2);
    expect(document.proof).not.toEqual(expect.arrayContaining([proof1, proof2]));
  });

  it('should add to existing proofs when using addProof()', () => {
    const did = 'did:example:123';
    const proof1: IProof = {
      id: 'did:example:signer1',
      type: 'EcdsaSecp256k1Signature2019',
      created: '2023-10-27T00:00:00Z',
      proofValue: 'test-signature-1',
      proofPurpose: ProofPurpose.Authentication,
      verificationMethod: 'did:example:signer1#key-1',
    };

    const proof2: IProof = {
      id: 'did:example:signer2',
      type: 'EcdsaSecp256k1Signature2019',
      created: '2023-10-28T00:00:00Z',
      proofValue: 'test-signature-2',
      proofPurpose: ProofPurpose.Authentication,
      verificationMethod: 'did:example:signer2#key-1',
    };

    const builder = DIDDocumentBuilder.create(did).withProof(proof1).addProof(proof2);

    const document = (builder as any).document as IDIDDocument;

    // Should have both proofs as an array, since addProof was used
    expect(Array.isArray(document.proof)).toBe(true);
    expect(document.proof).toEqual(expect.arrayContaining([proof1, proof2]));
  });

  it('should prevent modifications after document is sealed', () => {
    const did = 'did:example:123';
    const builder = DIDDocumentBuilder.create(did);

    // Seal the document
    builder.buildAndSeal();

    // Attempt to modify after sealing
    expect(() => builder.withId('did:example:456')).toThrow(
      'Document is sealed and cannot be modified',
    );
    expect(() => builder.withContext('https://new-context.org')).toThrow(
      'Document is sealed and cannot be modified',
    );
    expect(() => builder.withAlsoKnownAs(['https://example.com/new-id'])).toThrow(
      'Document is sealed and cannot be modified',
    );
    expect(() => builder.withProof({} as IProof)).toThrow(
      'Document is sealed and cannot be modified',
    );
    expect(() => builder.addProof({} as IProof)).toThrow(
      'Document is sealed and cannot be modified',
    );
  });

  it('should validate authentication methods correctly', () => {
    const did = 'did:example:123';

    // Valid methods
    const validBuilder = DIDDocumentBuilder.create(did).withAuthentication([
      'did:example:123#key-1',
      {
        id: 'did:example:123#key-2',
        type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
        controller: did,
        publicKeyMultibase: 'z6MkapK4oTttBsgN5v3wY5e7vYwtpwi7WB7uV85VEyv8',
      },
    ]);

    expect(() => validBuilder.build()).not.toThrow();

    // Invalid methods (missing key material) - now correctly expecting to throw
    const invalidBuilder = DIDDocumentBuilder.create(did).withAuthentication([
      'did:example:123#key-1',
      {
        id: 'did:example:123#key-2',
        type: VerificationMethodType.EcdsaSecp256k1VerificationKey2019,
        controller: did,
      } as any,
    ]);

    expect(() => invalidBuilder.build()).toThrow(
      'Invalid DID Document: Verification method at index 0 is missing key material (publicKeyJwk, publicKeyMultibase, etc.)',
    );
  });

  it('should allow updating document after build() but not after buildAndSeal()', () => {
    const did = 'did:example:123';

    // Test with build()
    const builder1 = DIDDocumentBuilder.create(did);
    const document1 = builder1.build();

    // Should still be able to modify the builder
    expect(() => builder1.withId('did:example:456')).not.toThrow();

    // Verify the document can be modified and reflects changes
    builder1.withId('did:example:456');
    const updatedDocument = builder1.build();
    expect(updatedDocument.id).toBe('did:example:456');
    expect(document1.id).toBe('did:example:456'); // document1 reflects the change

    // Test with buildAndSeal()
    const builder2 = DIDDocumentBuilder.create(did);
    const document2 = builder2.buildAndSeal();

    // Should NOT be able to modify the builder
    expect(() => builder2.withId('did:example:789')).toThrow(
      'Document is sealed and cannot be modified',
    );

    // Verify document2 is frozen/immutable
    expect(Object.isFrozen(document2)).toBe(true);
  });
});
