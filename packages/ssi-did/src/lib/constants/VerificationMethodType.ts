/**
 * @file Defines the VerificationMethodType enum aligned with W3C DID Core v1.0 and VC Data Model v2.0
 * @module VerificationMethodType
 */

/**
 * @enum {string} VerificationMethodType
 * @description Enumeration of standardized cryptographic verification method types used in
 * Decentralized Identifier (DID) documents, aligned with W3C DID Core v1.0 specification
 * and current Data Integrity cryptographic suites.
 *
 * These verification method types represent the standardized cryptographic mechanisms
 * recognized by the W3C DID Working Group and widely adopted in the decentralized
 * identity ecosystem. Each type corresponds to a specific cryptographic approach with
 * defined security properties and interoperability guarantees.
 *
 * IMPORTANT: This enum reflects W3C DID Core v1.0 and VC Data Model v2.0 standards.
 * Always consult the latest DID Specification Registries and W3C recommendations
 * for the most current verification method types.
 *
 * @see https://www.w3.org/TR/did-core/
 * @see https://www.w3.org/TR/vc-data-model-2.0/
 * @see https://w3c-ccg.github.io/did-method-registry/
 */
export enum VerificationMethodType {
  /**
   * @description JSON Web Key format for representing cryptographic keys in JSON.
   * The most versatile and widely supported verification method type in the ecosystem.
   *
   * Supports multiple key types (RSA, EC, OKP) and provides excellent interoperability
   * across different cryptographic libraries and platforms.
   *
   * @example DID Document verification method for web-based authentication systems
   * @standard W3C DID Core v1.0
   */
  JsonWebKey2020 = 'JsonWebKey2020',

  /**
   * @description Ed25519 signature verification key using the Edwards-curve Digital Signature Algorithm.
   * Recommended for new implementations due to excellent security and performance characteristics.
   *
   * Often used with the `eddsa-2022` cryptographic suite in Data Integrity proofs.
   * Provides compact signatures, fast verification, and strong security guarantees.
   *
   * @example High-security applications requiring efficient signature verification
   * @standard W3C DID Core v1.0, Data Integrity
   */
  Ed25519VerificationKey2020 = 'Ed25519VerificationKey2020',

  /**
   * @description ECDSA verification key using the secp256k1 elliptic curve.
   * Primarily used in blockchain and cryptocurrency applications.
   *
   * Compatible with Bitcoin, Ethereum, and other blockchain ecosystems.
   * Well-suited for applications requiring blockchain interoperability.
   *
   * @example Blockchain-based identity systems and cryptocurrency wallets
   * @standard Widely adopted in blockchain ecosystems
   */
  EcdsaSecp256k1VerificationKey2019 = 'EcdsaSecp256k1VerificationKey2019',

  /**
   * @description ECDSA verification key using NIST P-256 (secp256r1) curve.
   * Standard ECDSA implementation widely supported in enterprise environments.
   *
   * Commonly used with the `ecdsa-2019` cryptographic suite and provides
   * broad compatibility with existing PKI infrastructure.
   *
   * @example Enterprise systems requiring FIPS-compliant cryptography
   * @standard W3C DID Core v1.0, NIST approved
   */
  EcdsaSecp256r1VerificationKey2019 = 'EcdsaSecp256r1VerificationKey2019',

  /**
   * @description X25519 key agreement key for Elliptic Curve Diffie-Hellman (ECDH).
   * Used specifically for key agreement and establishing shared secrets.
   *
   * Enables secure key exchange protocols with forward secrecy properties.
   * Not used for signing operations, only for key agreement.
   *
   * @example Secure messaging systems requiring ephemeral key exchange
   * @standard W3C DID Core v1.0, RFC 7748
   */
  X25519KeyAgreementKey2019 = 'X25519KeyAgreementKey2019',

  /**
   * @description RSA verification key for traditional RSA-based signatures.
   * Maintained for backward compatibility with existing PKI systems.
   *
   * While still supported, Ed25519 or ECDSA are generally preferred
   * for new implementations due to better performance and security properties.
   *
   * @example Legacy enterprise systems requiring RSA key compatibility
   * @standard W3C DID Core v1.0
   */
  RsaVerificationKey2018 = 'RsaVerificationKey2018',

  /**
   * @description Multikey format supporting multiple key types in a unified representation.
   * Emerging standard that provides a codec-agnostic way to represent cryptographic keys.
   *
   * Supports various key types including Ed25519, secp256k1, P-256, P-384, and others
   * using a multicodec prefix system for type identification.
   *
   * @example Modern DID implementations requiring flexible key type support
   * @standard W3C DID Core v1.0 (emerging)
   */
  Multikey = 'Multikey',

  // Legacy types - consider deprecation in favor of Data Integrity cryptographic suites

  /**
   * @description ECDSA verification key using P-384 curve for higher security requirements.
   * Provides stronger security guarantees than P-256 at the cost of performance.
   *
   * @example High-security government or financial applications
   * @standard W3C DID Core v1.0
   */
  EcdsaSecp384r1VerificationKey2019 = 'EcdsaSecp384r1VerificationKey2019',
}
