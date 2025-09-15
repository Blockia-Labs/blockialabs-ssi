import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Complete SSI Toolkit',
    Svg: require('@site/static/img/toolkit-icon.svg').default,
    description: (
      <>
        Four focused SDKs for issuing, storing, verifying, and managing verifiable credentials. 
        Everything you need to build Self-Sovereign Identity applications.
      </>
    ),
  },
  {
    title: 'Standards Compliant',
    Svg: require('@site/static/img/standards-icon.svg').default,
    description: (
      <>
        OpenID4VCI Draft-17 and OpenID4VP Draft-24 compliant. 
        W3C Verifiable Credentials, DID specifications, and HD wallet standards (BIP32/BIP39).
      </>
    ),
  },
  {
    title: 'Developer First',
    Svg: require('@site/static/img/developer-icon.svg').default,
    description: (
      <>
        TypeScript-first with complete type safety. Clean APIs with incremental building blocks. 
        Professional architecture that scales from prototypes to production.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
