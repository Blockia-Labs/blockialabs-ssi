export * from './lib/core/activities/ActivityManager.js';
export * from './lib/core/activities/ActivityRepository.js';

export * from './lib/core/credentials/CredentialManager.js';
export * from './lib/core/credentials/CredentialRepository.js';

export * from './lib/core/identity/DIDManager.js';
export * from './lib/core/identity/DIDRepository.js';

export * from './lib/core/jwt/ProofManager.js';
export * from './lib/core/jwt/JwtBuilder.js';
export * from './lib/core/jwt/factories/JwtHeaderFactory.js';
export * from './lib/core/jwt/factories/JwtPayloadFactory.js';
export * from './lib/core/jwt/validators/ProofParamsValidator.js';

export * from './lib/core/crypto/crypto-utils.js';
export * from './lib/core/crypto/encoders/Base64UrlEncoder.js';
export * from './lib/core/crypto/encoders/BaseEncoder.js';
export * from './lib/core/crypto/signers/Secp256k1Signer.js';

export * from './lib/core/wallet/SecureWalletStorage.js';
export * from './lib/core/wallet/Wallet.js';
export * from './lib/core/wallet/WalletManager.js';

export * from './lib/core/shared/BaseRepository.js';
export * from './lib/core/shared/InMemoryStorage.js';

export * from './lib/types/models/activity.js';
export * from './lib/types/models/credential.js';
export * from './lib/types/models/did.js';
export * from './lib/types/models/jwt.js';
export * from './lib/types/models/wallet.js';
export * from './lib/types/index.js';

export * from './lib/utils/constants.js';
export * from './lib/utils/errors.js';
