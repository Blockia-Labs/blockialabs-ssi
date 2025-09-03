import { DIDDocumentSerializer } from '../../../core/did-document/DIDDocumentSerializer.js';

describe('DIDDocumentSerializer', () => {
  const doc = {
    'id': 'did:example:123',
    '@context': 'https://www.w3.org/ns/did/v1',
    'alsoKnownAs': ['https://example.com/profile1', 'https://example.com/profile2'],
  };

  // const context = [
  //   {
  //     id: '@id',
  //     alsoKnownAs: { '@id': 'https://www.w3.org/ns/activitystreams#alsoKnownAs', '@type': '@id' },
  //   },
  // ];

  describe('toJSON', () => {
    it('should serialize a DID document to a JSON string', () => {
      const jsonString = DIDDocumentSerializer.toJSON(doc);
      expect(jsonString).toBe(JSON.stringify(doc, null, 2));
    });
  });

  describe('toJSONLD', () => {
    // TODO: Check & Fix failing test
    // it('should serialize a DID document to a JSON-LD string', async () => {
    //   const jsonldString = await DIDDocumentSerializer.toJSONLD(doc, {
    //     context: context,
    //     compact: true,
    //   });

    //   expect(jsonldString).toBeDefined(); // Check that jsonldString is not null or undefined
    //   expect(typeof jsonldString).toBe('string'); // Check it's a string

    //   const parsedCompacted = JSON.parse(jsonldString); // Ensure it can be parsed
    //   expect(parsedCompacted.id).toBeDefined();
    //   expect(parsedCompacted.alsoKnownAs).toEqual(doc.alsoKnownAs);

    //   const expanded = await DIDDocumentSerializer.toJSONLD(parsedCompacted, {
    //     expand: true,
    //   });

    //   expect(expanded).toBeDefined();
    // });

    it('should throw an error if the document lacks a @context', async () => {
      const invalidDoc = { id: 'did:example:123' };
      await expect(DIDDocumentSerializer.toJSONLD(invalidDoc)).rejects.toThrow(
        'DID Document must have a @context for JSON-LD serialization',
      );
    });
  });

  describe('fromJSONLD', () => {
    // TODO: Check & Fix failing test
    // it('should parse a JSON-LD string into a DID document', async () => {
    //   const jsonldString = JSON.stringify(doc);
    //   const parsedDocument = await DIDDocumentSerializer.fromJSONLD(jsonldString);
    //   expect(parsedDocument).toEqual(doc);
    // });

    it('should throw an error if the JSON-LD string is invalid', async () => {
      await expect(DIDDocumentSerializer.fromJSONLD('invalid json')).rejects.toThrow();
    });

    it('should throw an error if the JSON-LD string is an invalid DID document', async () => {
      const invalidJsonld = JSON.stringify({ invalid: 'document' });
      await expect(DIDDocumentSerializer.fromJSONLD(invalidJsonld)).rejects.toThrow();
    });
  });

  describe('canonicalize', () => {
    // TODO: Check & Fix failing test
    // it('should produce a canonicalized version of the DID document', async () => {
    //   const canonized = await DIDDocumentSerializer.canonicalize(doc);
    //   // We don't expect a specific value here, just checking it runs without errors
    //   expect(typeof canonized).toBe('string');
    // });

    it('should throw an error if the document lacks a @context', async () => {
      const invalidDocument = { id: 'did:example:123' };
      await expect(DIDDocumentSerializer.canonicalize(invalidDocument)).rejects.toThrow(
        'DID Document must have a @context for canonicalization',
      );
    });
  });
});
