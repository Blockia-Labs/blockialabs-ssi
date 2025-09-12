import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'getting-started/installation',
    {
      type: 'category',
      label: 'Core SDKs',
      items: [
        'sdks/issuer-sdk',
        'sdks/wallet-sdk', 
        'sdks/verifier-sdk',
        'sdks/did-core',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/package-overview',
      ],
    },
  ],
};

export default sidebars;
