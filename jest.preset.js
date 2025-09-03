const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  transformIgnorePatterns: [
    // The following packages use ESM and need to be transformed by Jest
    '/node_modules/(?!(@scure|@noble)/).*',
  ],
};
