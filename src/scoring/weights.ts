/**
 * Configurable weight definitions for the trust scoring engine.
 */

import type { WeightDefinition } from '../types/scores.js';
import { SCORE_CATEGORIES } from './categories.js';

/** Default weights for each scoring category. Sum should be 100. */
export const DEFAULT_WEIGHTS: WeightDefinition[] = [
  {
    category: SCORE_CATEGORIES.HEALTH,
    label: 'Repository Health',
    defaultWeight: 15,
    description: 'How actively maintained is the repository',
  },
  {
    category: SCORE_CATEGORIES.MAINTAINER_TRUST,
    label: 'Maintainer Trust',
    defaultWeight: 15,
    description: 'Stability and verification of maintainers',
  },
  {
    category: SCORE_CATEGORIES.SUPPLY_CHAIN,
    label: 'Supply Chain Integrity',
    defaultWeight: 20,
    description: 'Publishing provenance and metadata integrity',
  },
  {
    category: SCORE_CATEGORIES.INSTALL_SCRIPTS,
    label: 'Install Script Safety',
    defaultWeight: 20,
    description: 'Safety of preinstall/postinstall scripts',
  },
  {
    category: SCORE_CATEGORIES.COMMUNITY,
    label: 'Community Adoption',
    defaultWeight: 10,
    description: 'Downloads, popularity, and community engagement',
  },
  {
    category: SCORE_CATEGORIES.PACKAGE_AGE,
    label: 'Package Maturity',
    defaultWeight: 5,
    description: 'How long the package has existed',
  },
  {
    category: SCORE_CATEGORIES.RELEASE_QUALITY,
    label: 'Release Quality',
    defaultWeight: 10,
    description: 'Release frequency and consistency',
  },
  {
    category: SCORE_CATEGORIES.RISK_INDICATORS,
    label: 'Risk Indicators',
    defaultWeight: 5,
    description: 'Negative signals (typosquatting, exfiltration)',
  },
];

/**
 * Merge user-provided weight overrides with defaults.
 */
export function mergeWeights(
  overrides: Record<string, number>,
): WeightDefinition[] {
  return DEFAULT_WEIGHTS.map((w) => ({
    ...w,
    defaultWeight: overrides[w.category] ?? w.defaultWeight,
  }));
}
