/**
 * Score category definitions and scorers.
 */

export const SCORE_CATEGORIES = {
  HEALTH: 'health',
  MAINTAINER_TRUST: 'maintainer-trust',
  SUPPLY_CHAIN: 'supply-chain',
  INSTALL_SCRIPTS: 'install-scripts',
  COMMUNITY: 'community',
  PACKAGE_AGE: 'package-age',
  RELEASE_QUALITY: 'release-quality',
  RISK_INDICATORS: 'risk-indicators',
} as const;

export type ScoreCategory = (typeof SCORE_CATEGORIES)[keyof typeof SCORE_CATEGORIES];

/** Category metadata for display. */
export const CATEGORY_METADATA: Record<ScoreCategory, { label: string; description: string }> = {
  [SCORE_CATEGORIES.HEALTH]: {
    label: 'Repository Health',
    description: 'Stars, contributors, commits, issue management',
  },
  [SCORE_CATEGORIES.MAINTAINER_TRUST]: {
    label: 'Maintainer Trust',
    description: 'Maintainer stability, bus factor, verification',
  },
  [SCORE_CATEGORIES.SUPPLY_CHAIN]: {
    label: 'Supply Chain Integrity',
    description: 'Publishing provenance, maintainer changes, dependency mutations',
  },
  [SCORE_CATEGORIES.INSTALL_SCRIPTS]: {
    label: 'Install Script Safety',
    description: 'AST analysis of install scripts for dangerous patterns',
  },
  [SCORE_CATEGORIES.COMMUNITY]: {
    label: 'Community Adoption',
    description: 'Weekly downloads, dependents, popularity',
  },
  [SCORE_CATEGORIES.PACKAGE_AGE]: {
    label: 'Package Maturity',
    description: 'Repository age, version count, stability',
  },
  [SCORE_CATEGORIES.RELEASE_QUALITY]: {
    label: 'Release Quality',
    description: 'Release frequency, cadence consistency, deprecation',
  },
  [SCORE_CATEGORIES.RISK_INDICATORS]: {
    label: 'Risk Indicators',
    description: 'Typosquatting, exfiltration patterns, anomalies',
  },
};
