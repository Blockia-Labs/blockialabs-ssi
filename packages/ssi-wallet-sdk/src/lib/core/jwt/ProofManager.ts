import { ProofParams } from '../../types/index.js';
import { JwtBuilder } from './JwtBuilder.js';
import { Base64UrlEncoder } from '../crypto/encoders/Base64UrlEncoder.js';
import { Secp256k1Signer } from '../crypto/signers/Secp256k1Signer.js';
import { JwtHeaderFactory } from './factories/JwtHeaderFactory.js';
import { JwtPayloadFactory } from './factories/JwtPayloadFactory.js';
import { ProofParamsValidator } from './validators/ProofParamsValidator.js';

/**
 * Main ProofManager class for SECP256K1 JWT proof generation
 */
export class ProofManager {
  private readonly validator: ProofParamsValidator;
  private readonly headerFactory: JwtHeaderFactory;
  private readonly payloadFactory: JwtPayloadFactory;
  private readonly signer: Secp256k1Signer;
  private readonly jwtBuilder: JwtBuilder;

  constructor() {
    const encoder = new Base64UrlEncoder();

    this.validator = new ProofParamsValidator();
    this.headerFactory = new JwtHeaderFactory();
    this.payloadFactory = new JwtPayloadFactory();
    this.signer = new Secp256k1Signer();
    this.jwtBuilder = new JwtBuilder(encoder);
  }

  /**
   * Generates a JWT proof using SECP256K1 signature
   */
  public async generateJwtProof(params: ProofParams): Promise<string> {
    try {
      this.validator.validate(params);

      const header = this.headerFactory.createHeader(params.holderDid);
      const payload = this.payloadFactory.createPayload(
        params.holderDid,
        params.issuerDid,
        params.nonce,
      );

      const signingMessage = this.jwtBuilder.buildSigningMessage(header, payload);
      const signature = this.signer.sign(signingMessage, params.privateKey);

      return this.jwtBuilder.buildToken(header, payload, signature);
    } catch (error) {
      throw new Error(
        `Failed to generate JWT proof: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
