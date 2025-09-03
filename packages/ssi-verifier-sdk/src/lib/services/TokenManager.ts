import { ClaimWithMetadata } from '../types/ClaimTypes.js';
import { IStorage } from '@blockialabs/ssi-storage';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface TokenData {
  refreshTokenId: string;
  refreshTokenExpiresAt: number;
  transactionId: string;
  nonce: string;
  claims: ClaimWithMetadata[];
}

export interface TokenRecord {
  id: string;
  refreshTokenId: string;
  refreshTokenExpiresAt: number;
  nonce: string;
  isRevoked?: boolean;
  revokedAt?: number;
  transactionId: string;
  sub?: string;
  claims: ClaimWithMetadata[];
}

export class TokenManager {
  constructor(
    private tokenStorage: IStorage<TokenRecord>,
    private options: {
      clientId: string;
      issuerId: string;
      signingKey: string;
      signingKeyId?: string;
      accessTokenExpiresIn: number;
      refreshTokenExpiresIn: number;
    },
  ) {
    if (!options.clientId || !options.signingKey) {
      throw new Error('TokenManager requires clientId and signingKey');
    }
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async createTokens(
    transactionId: string,
    claims: ClaimWithMetadata[],
    holderDid?: string,
  ): Promise<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
    refreshTokenId: string;
    expiresIn: number;
  }> {
    const now = Math.floor(Date.now() / 1000);
    const refreshTokenId = this.generateNonce();
    const nonce = this.generateNonce();

    const tokenHeader: jwt.JwtHeader = {
      alg: 'ES256',
      typ: 'JWT',
      ...(this.options.signingKeyId ? { kid: this.options.signingKeyId } : {}),
    };

    // Create access token with all claims and metadata
    const accessTokenPayload = {
      // add issuer baseUrl
      iss: this.options.issuerId,
      sub: holderDid,
      aud: this.options.clientId,
      iat: now,
      exp: now + this.options.accessTokenExpiresIn,
      jti: this.generateNonce(),
      nonce,
      claims: claims.map(({ claim, metadata }) => ({
        ...claim,
        _metadata: metadata,
      })),
    };

    // Create ID token with just the claims (no metadata)
    const idTokenPayload = {
      iss: this.options.issuerId,
      sub: holderDid,
      aud: this.options.clientId,
      iat: now,
      exp: now + this.options.accessTokenExpiresIn,
      jti: this.generateNonce(),
      nonce,
      claims: claims.map(({ claim }) => claim),
    };

    // Create refresh token
    const refreshTokenPayload = {
      iss: this.options.issuerId,
      sub: holderDid,
      aud: this.options.clientId,
      iat: now,
      exp: now + this.options.refreshTokenExpiresIn,
      jti: refreshTokenId,
      nonce,
      type: 'refresh',
    };

    // Sign all tokens
    const accessToken = jwt.sign(accessTokenPayload, this.options.signingKey, {
      algorithm: 'ES256',
      header: tokenHeader,
    });
    const idToken = jwt.sign(idTokenPayload, this.options.signingKey, {
      algorithm: 'ES256',
      header: tokenHeader,
    });
    const refreshToken = jwt.sign(refreshTokenPayload, this.options.signingKey, {
      algorithm: 'ES256',
      header: tokenHeader,
    });

    // Store token data if we have storage
    if (this.tokenStorage) {
      const record: TokenRecord = {
        id: refreshTokenId,
        refreshTokenId,
        refreshTokenExpiresAt: now + this.options.refreshTokenExpiresIn,
        nonce,
        transactionId,
        sub: holderDid,
        claims,
      };
      await this.tokenStorage.set(refreshTokenId, record);
    }

    return {
      accessToken,
      idToken,
      refreshToken,
      refreshTokenId,
      expiresIn: this.options.accessTokenExpiresIn,
    };
  }

  async getTokenData(tokenId: string): Promise<TokenRecord | null> {
    if (!this.tokenStorage) {
      return null;
    }
    return this.tokenStorage.get(tokenId);
  }

  async validateRefreshToken(refreshToken: string): Promise<TokenRecord | null> {
    try {
      // Verify and decode the refresh token
      const decoded = jwt.verify(refreshToken, this.options.signingKey) as jwt.JwtPayload;

      if (!decoded.jti || decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get token record
      const record = await this.getTokenData(decoded.jti);
      if (!record) {
        throw new Error('Refresh token not found');
      }

      // Check if token is revoked
      if (record.isRevoked) {
        throw new Error('Refresh token has been revoked');
      }

      // Check expiration
      if (record.refreshTokenExpiresAt < Math.floor(Date.now() / 1000)) {
        throw new Error('Refresh token has expired');
      }

      return record;
    } catch (error) {
      return null;
    }
  }

  async revokeToken(tokenId: string): Promise<void> {
    if (!this.tokenStorage) {
      return;
    }

    const record = await this.tokenStorage.get(tokenId);
    if (record) {
      record.isRevoked = true;
      record.revokedAt = Math.floor(Date.now() / 1000);
      await this.tokenStorage.set(tokenId, record);
    }
  }
}
