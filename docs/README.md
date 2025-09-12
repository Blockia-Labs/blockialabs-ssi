# SSI Toolkit Documentation

This directory contains the Docusaurus documentation site for the SSI Toolkit.

## Local Development

```bash
cd docs
npm install
npm start
```

This starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
cd docs
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## GitHub Pages Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Automatic Deployment

The `.github/workflows/deploy-docs.yml` workflow handles automatic deployment:

1. **Trigger**: Runs on push to `main` branch when files in `docs/` directory change
2. **Build**: Installs dependencies and runs `npm run build`  
3. **Deploy**: Uploads build artifacts to GitHub Pages

### Manual Deployment

To trigger a manual deployment:

1. Go to the repository's Actions tab
2. Select "Deploy Documentation" workflow
3. Click "Run workflow" button

### GitHub Pages Configuration

In your repository settings:

1. Go to **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. The site will be available at: `https://blockia-labs.github.io/blockialabs-ssi/`

### Build Artifacts

The following directories are excluded from version control (`.gitignore`):

- `docs/build/` - Generated static site
- `docs/.docusaurus/` - Docusaurus cache and temporary files

## Documentation Structure

```
docs/
├── docs/                  # Documentation content (Markdown)
│   ├── getting-started/   # Installation and setup guides
│   ├── sdks/             # Individual SDK documentation
│   └── architecture/     # System architecture guides
├── src/                  # Custom React components
├── static/               # Static assets (images, icons)
├── docusaurus.config.ts  # Docusaurus configuration
└── sidebars.ts          # Navigation sidebar configuration
```

## Configuration

Key configuration files:

- `docusaurus.config.ts` - Main Docusaurus configuration
- `sidebars.ts` - Documentation navigation structure  
- `package.json` - Dependencies and build scripts

The site is configured for GitHub Pages deployment with:

- `baseUrl: '/blockialabs-ssi/'` - Repository name as base path
- `organizationName: 'Blockia-Labs'` - GitHub organization
- `projectName: 'blockialabs-ssi'` - Repository name
