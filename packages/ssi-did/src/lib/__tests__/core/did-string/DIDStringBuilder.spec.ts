import { DIDStringBuilder } from '../../../core/did-string/DIDStringBuilder.js';

describe('DIDStringBuilder', () => {
  describe('create method', () => {
    it('should create a new builder with the specified method and a required identifier', () => {
      const builder = DIDStringBuilder.create('key');
      const did = builder.withMethodSpecificIdentifier('123').build();
      expect(builder).toBeInstanceOf(DIDStringBuilder);
      expect(did).toBe('did:key:123');
    });

    it('should throw an error when method is empty', () => {
      expect(() => {
        DIDStringBuilder.create('');
      }).toThrow('DID method cannot be null or empty');
    });

    it('should throw an error when method is null', () => {
      expect(() => {
        DIDStringBuilder.create(null as never);
      }).toThrow('DID method cannot be null or empty');
    });
  });

  describe('withMethodSpecificIdentifier method', () => {
    it('should add the method-specific identifier to the DID', () => {
      const did = DIDStringBuilder.create('key')
        .withMethodSpecificIdentifier('z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH')
        .build();

      expect(did).toBe('did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH');
    });

    it('should override previous method-specific identifier when called multiple times', () => {
      const did = DIDStringBuilder.create('key')
        .withMethodSpecificIdentifier('abc123')
        .withMethodSpecificIdentifier('xyz789')
        .build();

      expect(did).toBe('did:key:xyz789');
    });

    it('should throw an error if build is called without specifying an identifier', () => {
      expect(() => {
        DIDStringBuilder.create('key').build();
      }).toThrow('Invalid DID: did:key');
    });
  });

  describe('withPath method', () => {
    it('should add the path to the DID', () => {
      const did = DIDStringBuilder.create('web')
        .withMethodSpecificIdentifier('example.com')
        .withPath('user/profile')
        .build();

      expect(did).toBe('did:web:example.com/user/profile');
    });

    it('should add a leading slash to the path if not provided', () => {
      const did = DIDStringBuilder.create('web')
        .withMethodSpecificIdentifier('example.com')
        .withPath('path')
        .build();

      expect(did).toBe('did:web:example.com/path');
    });

    it('should preserve the leading slash if provided', () => {
      const did = DIDStringBuilder.create('web')
        .withMethodSpecificIdentifier('example.com')
        .withPath('/path')
        .build();

      expect(did).toBe('did:web:example.com/path');
    });
  });

  describe('withParameter method', () => {
    it('should add a parameter to the DID', () => {
      const did = DIDStringBuilder.create('ion')
        .withMethodSpecificIdentifier('123456')
        .withParameter('version', '1')
        .build();

      expect(did).toBe('did:ion:123456?version=1');
    });

    it('should add multiple parameters to the DID', () => {
      const did = DIDStringBuilder.create('ion')
        .withMethodSpecificIdentifier('123456')
        .withParameter('version', '1')
        .withParameter('service', 'identity')
        .build();

      // Note: The order of parameters may vary in the actual implementation
      // This test may need adjustment if the implementation has a specific ordering
      expect(did).toMatch(
        /^did:ion:123456\?version=1&service=identity|service=identity&version=1$/,
      );
    });

    it('should override parameter value if the same parameter is added multiple times', () => {
      const did = DIDStringBuilder.create('ion')
        .withMethodSpecificIdentifier('123456')
        .withParameter('version', '1')
        .withParameter('version', '2')
        .build();

      expect(did).toBe('did:ion:123456?version=2');
    });
  });

  describe('withFragment method', () => {
    it('should add a fragment to the DID', () => {
      const did = DIDStringBuilder.create('key')
        .withMethodSpecificIdentifier('z6Mk')
        .withFragment('keys-1')
        .build();

      expect(did).toBe('did:key:z6Mk#keys-1');
    });

    it('should override previous fragment when called multiple times', () => {
      const did = DIDStringBuilder.create('key')
        .withMethodSpecificIdentifier('z6Mk')
        .withFragment('keys-1')
        .withFragment('keys-2')
        .build();

      expect(did).toBe('did:key:z6Mk#keys-2');
    });
  });

  describe('build method', () => {
    it('should build a complete DID with all components', () => {
      const did = DIDStringBuilder.create('example')
        .withMethodSpecificIdentifier('123456789abcdefghi')
        .withPath('/data')
        .withParameter('service', 'files')
        .withParameter('version', '1.0')
        .withFragment('document')
        .build();

      // The order of parameters might vary, so using regex to check
      expect(did).toMatch(
        /^did:example:123456789abcdefghi\/data\?service=files&version=1\.0|version=1\.0&service=files#document$/,
      );
    });

    it('should throw an error when building a DID without method-specific identifier', () => {
      expect(() => {
        DIDStringBuilder.create('example').build();
      }).toThrow('Invalid DID: did:example');
    });
  });

  describe('complex scenarios', () => {
    it('should handle parameters in DIDs with a method-specific identifier', () => {
      const did = DIDStringBuilder.create('example')
        .withMethodSpecificIdentifier('123')
        .withParameter('version', '1')
        .build();

      expect(did).toBe('did:example:123?version=1');
    });

    it('should handle a DID with method, identifier, parameter, and fragment', () => {
      const did = DIDStringBuilder.create('example')
        .withMethodSpecificIdentifier('123')
        .withParameter('version', '1')
        .withFragment('test')
        .build();

      expect(did).toBe('did:example:123?version=1#test');
    });

    it('should handle method chaining in any order', () => {
      const did = DIDStringBuilder.create('example')
        .withFragment('frag')
        .withMethodSpecificIdentifier('12345')
        .withParameter('key', 'value')
        .withPath('/path')
        .build();

      expect(did).toBe('did:example:12345/path?key=value#frag');
    });
  });

  describe('interaction with DIDStringValidator', () => {
    it('should throw error when creating a DID that violates validator rules', () => {
      // Create a DID with special characters that might fail validation
      expect(() => {
        DIDStringBuilder.create('test')
          .withMethodSpecificIdentifier('invalid identifier with spaces')
          .build();
      }).toThrow(/Invalid DID:/);
    });
  });
});
