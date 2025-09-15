import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Blockialabs SSI SDK',
  tagline: 'Professional Self-Sovereign Identity toolkit for developers',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://blockia-labs.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/blockialabs-ssi/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Blockia-Labs', // Usually your GitHub org/user name.
  projectName: 'blockialabs-ssi', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/Blockia-Labs/blockialabs-ssi/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Social card for Blockia SDK (will use site screenshot)
    image: 'img/logo.svg',
    navbar: {
      title: 'Blockialabs SSI',
      logo: {
        alt: 'Blockialabs SSI Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'dropdown',
          label: 'SDKs',
          position: 'left',
          items: [
            {
              label: 'Issuer SDK',
              to: '/docs/sdks/issuer-sdk',
            },
            {
              label: 'Wallet SDK',
              to: '/docs/sdks/wallet-sdk',
            },
            {
              label: 'Verifier SDK',
              to: '/docs/sdks/verifier-sdk',
            },
            {
              label: 'DID Core SDK',
              to: '/docs/sdks/did-core',
            },
          ],
        },
        {
          href: 'https://github.com/Blockia-Labs/blockialabs-ssi',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Package Overview',
              to: '/docs/architecture/package-overview',
            },
          ],
        },
        {
          title: 'SDKs',
          items: [
            {
              label: 'Issuer SDK',
              to: '/docs/sdks/issuer-sdk',
            },
            {
              label: 'Wallet SDK',
              to: '/docs/sdks/wallet-sdk',
            },
            {
              label: 'Verifier SDK',
              to: '/docs/sdks/verifier-sdk',
            },
            {
              label: 'DID Core SDK',
              to: '/docs/sdks/did-core',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'GitHub Repository',
              href: 'https://github.com/Blockia-Labs/blockialabs-ssi',
            },
            {
              label: 'NPM Packages',
              href: 'https://www.npmjs.com/org/blockialabs',
            },
            {
              label: 'Report Issues',
              href: 'https://github.com/Blockia-Labs/blockialabs-ssi/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © 2025 Blockia Labs. Built for Self-Sovereign Identity.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
