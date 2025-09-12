import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--primary button--lg"
            to="/docs/sdks/issuer-sdk">
            View SDKs
          </Link>
        </div>
      </div>
    </header>
  );
}

function SDKShowcase(): ReactNode {
  return (
    <section className="container margin-vert--lg">
      <div className="row">
        <div className="col">
          <h2 className="text--center margin-bottom--lg">Four Focused SDKs</h2>
          <div className="row">
            <div className="col col--6 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <h3>Issuer SDK</h3>
                </div>
                <div className="card__body">
                  <p>Issue verifiable credentials following OpenID4VCI Draft-17 standards. For universities, employers, and certification bodies.</p>
                </div>
                <div className="card__footer">
                  <Link className="button button--primary button--block" to="/docs/sdks/issuer-sdk">
                    Explore Issuer SDK
                  </Link>
                </div>
              </div>
            </div>
            <div className="col col--6 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <h3>Wallet SDK</h3>
                </div>
                <div className="card__body">
                  <p>HD wallet with secure credential storage and DID management. For mobile apps and user-facing applications.</p>
                </div>
                <div className="card__footer">
                  <Link className="button button--primary button--block" to="/docs/sdks/wallet-sdk">
                    Explore Wallet SDK
                  </Link>
                </div>
              </div>
            </div>
            <div className="col col--6 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <h3>Verifier SDK</h3>
                </div>
                <div className="card__body">
                  <p>Complete OpenID4VP Draft-24 verification with presentation definitions. For employers and service providers.</p>
                </div>
                <div className="card__footer">
                  <Link className="button button--primary button--block" to="/docs/sdks/verifier-sdk">
                    Explore Verifier SDK
                  </Link>
                </div>
              </div>
            </div>
            <div className="col col--6 margin-bottom--lg">
              <div className="card">
                <div className="card__header">
                  <h3>DID Core SDK</h3>
                </div>
                <div className="card__body">
                  <p>Universal DID operations supporting multiple DID methods. The foundation that powers all other SDKs.</p>
                </div>
                <div className="card__footer">
                  <Link className="button button--primary button--block" to="/docs/sdks/did-core">
                    Explore DID Core SDK
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Professional TypeScript SDK toolkit for Self-Sovereign Identity (SSI) applications. Four focused SDKs for issuing, storing, verifying, and managing verifiable credentials.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <SDKShowcase />
      </main>
    </Layout>
  );
}
