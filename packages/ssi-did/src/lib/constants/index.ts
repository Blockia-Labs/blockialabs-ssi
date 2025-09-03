export * from './ProofPurpose.js';
export * from './ServiceType.js';
export * from './VerificationMethodType.js';

const PCT_ENCODED = '(?:%[0-9a-fA-F]{2})';
const ID_CHAR = `(?:[a-zA-Z0-9._-]|${PCT_ENCODED})`;
const METHOD = '([a-z0-9]+)';
const METHOD_ID = `((?:${ID_CHAR}*:)*(${ID_CHAR}+))`;
const PARAM_CHAR = '[a-zA-Z0-9_.:%-]';
const PARAM = `;${PARAM_CHAR}+=${PARAM_CHAR}*`;
const PARAMS = `((${PARAM})*)`;
const PATH = `(/[^#?]*)?`;
const QUERY = `([?][^#]*)?`;
const FRAGMENT = `(#.*)?`;

/**
 * Regular expression for validating Decentralized Identifiers (DIDs) according to the W3C DID Core 1.0 specification.
 *
 * This regex checks for the basic structure of a DID, including:
 * - The 'did:' prefix.
 * - A valid method name (lowercase alphanumeric).
 * - A method-specific identifier (alphanumeric, dot, hyphen, underscore, percent-encoded characters, and optional colon-separated segments).
 * - Optional path, query, and fragment components as defined in DID URL syntax.
 *
 * **Important Notes:**
 * - This regex provides a general validation of the DID structure.
 * - Specific DID methods may impose further constraints on the method name and method-specific identifier format, which are not enforced by this regex.
 * - The regex is designed to be permissive enough to validate a wide range of valid DIDs and DID URLs, while still catching common syntax errors.
 * - It is aligned with both the DID Syntax and DID URL Syntax defined in the W3C DID Core 1.0 specification.
 *
 * **References:**
 * - [W3C DID Core 1.0: DID Syntax](https://www.w3.org/TR/did-1.0/#did-syntax)
 * - [W3C DID Core 1.0: DID URL Syntax](https://www.w3.org/TR/did-1.0/#did-url-syntax)
 *
 * @constant {RegExp} DID_REGEX
 */
export const DID_REGEX = new RegExp(
  `^did:${METHOD}:${METHOD_ID}${PARAMS}${PATH}${QUERY}${FRAGMENT}$`,
);
