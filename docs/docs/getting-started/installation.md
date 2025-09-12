# Installation

Install Blockialabs SSI libraries in your project.

## Package Managers

### NPM
```bash
npm install @blockialabs/ssi-issuer-sdk
npm install @blockialabs/ssi-wallet-sdk  
npm install @blockialabs/ssi-verifier-sdk
npm install @blockialabs/ssi-did @blockialabs/ssi-did-key
```

### PNPM
```bash
pnpm add @blockialabs/ssi-issuer-sdk
pnpm add @blockialabs/ssi-wallet-sdk
pnpm add @blockialabs/ssi-verifier-sdk  
pnpm add @blockialabs/ssi-did @blockialabs/ssi-did-key
```

### Yarn
```bash
yarn add @blockialabs/ssi-issuer-sdk
yarn add @blockialabs/ssi-wallet-sdk
yarn add @blockialabs/ssi-verifier-sdk
yarn add @blockialabs/ssi-did @blockialabs/ssi-did-key
```

## Package.json Setup

Add to your `package.json` dependencies:

```json
{
  "dependencies": {
    "@blockialabs/ssi-issuer-sdk": "^1.0.0",
    "@blockialabs/ssi-wallet-sdk": "^1.0.0", 
    "@blockialabs/ssi-verifier-sdk": "^1.0.0",
    "@blockialabs/ssi-did": "^1.0.0",
    "@blockialabs/ssi-did-key": "^1.0.0"
  }
}
```

**Install only what you need:**
- **Issuer SDK** - Issue credentials
- **Wallet SDK** - Store credentials, manage keys
- **Verifier SDK** - Verify credentials  
- **DID Core** - DID operations (required by all SDKs)

## PWA & Mobile Support

### Browser/PWA Installation

**For Progressive Web Apps:**
```bash
npm install @blockialabs/ssi-wallet-sdk buffer crypto-browserify
```

**Required polyfills for crypto in browser:**
```json
{
  "dependencies": {
    "buffer": "^6.0.3",
    "crypto-browserify": "^3.12.0"
  }
}
```

### Webpack Configuration

Add to `webpack.config.js`:
```javascript
module.exports = {
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  ]
};
```

### Vite Configuration

Add to `vite.config.js`:
```javascript
export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
});
```

## Installation Verification

Create `test.js`:
```javascript
// Test with any SDK you installed
const { WalletManager } = require('@blockialabs/ssi-wallet-sdk');
// const { CredentialIssuer } = require('@blockialabs/ssi-issuer-sdk');
// const { VerifierSDK } = require('@blockialabs/ssi-verifier-sdk');

console.log('✅ Blockialabs SSI SDK installed');
```

Run: `node test.js`

## Common Issues & Solutions

### Version Compatibility
Use the same version across all `@blockialabs` packages:
```bash
npm install @blockialabs/ssi-wallet-sdk@1.0.0 @blockialabs/ssi-did@1.0.0
```

### Module Resolution Errors
Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Browser Crypto Errors
If you see crypto module errors in browser, install polyfills:
```bash
npm install buffer crypto-browserify
```

### PWA Security Requirement
SSI operations require secure contexts. Ensure your PWA runs on HTTPS:
```javascript
if (!window.isSecureContext) {
  throw new Error('SSI requires HTTPS in production');
}
```

## Next Steps

**Libraries installed** - Choose your SDK guide: [Issuer](/docs/sdks/issuer-sdk) • [Wallet](/docs/sdks/wallet-sdk) • [Verifier](/docs/sdks/verifier-sdk) • [DID Core](/docs/sdks/did-core)