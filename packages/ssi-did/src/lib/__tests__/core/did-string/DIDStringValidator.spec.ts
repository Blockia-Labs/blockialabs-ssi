import { DIDStringValidator } from '../../../core/did-string/DIDStringValidator.js';

describe('DIDValidator', () => {
  describe('isValidDID', () => {
    it('should return true for a valid DID', () => {
      expect(DIDStringValidator.isValidDID('did:method:12345')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:key:example')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:web:example.com')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:method:identifier.with.dots')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:method:identifier_with_underscores')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:method:identifier-with-hyphens')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:method:identifier/with/slashes')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:method:identifier:with:colons')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:method:identifier:with?query=true')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:method:identifier:with#fragment')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:example:123456/path')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:example:123456?versionId=1')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:example:123#public-key-0')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:example:123#agent')).toBe(true);
      expect(
        DIDStringValidator.isValidDID(
          'did:example:123?service=agent&relativeRef=/credentials#degree',
        ),
      ).toBe(true);
      expect(
        DIDStringValidator.isValidDID('did:example:123?versionTime=2021-05-10T17:00:00Z'),
      ).toBe(true);
      expect(
        DIDStringValidator.isValidDID('did:example:123?service=files&relativeRef=/resume.pdf'),
      ).toBe(true);
      expect(DIDStringValidator.isValidDID('did:example:123456789abcdefghi')).toBe(true);
      expect(DIDStringValidator.isValidDID('did:example:123456789abcdefghi#key-1')).toBe(true);
    });

    it('should return false for an invalid DID (wrong prefix)', () => {
      expect(DIDStringValidator.isValidDID('xid:example:12345')).toBe(false);
    });

    it('should return false for an invalid DID (missing method)', () => {
      expect(DIDStringValidator.isValidDID('did::12345')).toBe(false);
    });

    it('should return false for an invalid DID (invalid characters in method)', () => {
      expect(DIDStringValidator.isValidDID('did:ExAmPlE:12345')).toBe(false); // Uppercase
      expect(DIDStringValidator.isValidDID('did:example!:12345')).toBe(false); // Special character
    });

    it('should return false for a DID with commas', () => {
      expect(DIDStringValidator.isValidDID('did:test:1,2,3')).toBe(false);
    });
  });

  describe('isValidVerificationMethodId', () => {
    it('should return true for a valid verification method ID', () => {
      expect(DIDStringValidator.isValidVerificationMethodId('https://example.com#key-1')).toBe(
        true,
      );
      expect(DIDStringValidator.isValidVerificationMethodId('http://example.com#key-1')).toBe(true);
      expect(DIDStringValidator.isValidVerificationMethodId('https://example.com/path#key-1')).toBe(
        true,
      );
      expect(DIDStringValidator.isValidVerificationMethodId('did:example:123#key-1')).toBe(true);
    });

    it('should return false for an invalid verification method ID (missing hash)', () => {
      expect(DIDStringValidator.isValidVerificationMethodId('https://example.com')).toBe(false);
      expect(DIDStringValidator.isValidVerificationMethodId('https://example.com/path')).toBe(
        false,
      );
      expect(DIDStringValidator.isValidVerificationMethodId('did:example:123')).toBe(false);
    });

    it('should return false for an invalid verification method ID (not a URL)', () => {
      expect(DIDStringValidator.isValidVerificationMethodId('not a url')).toBe(false);
    });
  });
});
