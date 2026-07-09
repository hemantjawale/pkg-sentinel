/**
 * Score-related types for the trust scoring engine.
 */

/** A single score category result. */
export interface CategoryScore {
  /** Category identifier (e.g. 'health', 'supply-chain'). */
  category: string;

  /** Human-readable label. */
  label: string;

  /** Normalized score 0–100. */
  score: number;

  /** Weight applied to this category (0–100). */
  weight: number;

  /** Weighted contribution to total score. */
  weightedScore: number;

  /** Individual metric breakdowns within this category. */
  metrics: MetricScore[];

  /** Short explanation of how the score was derived. */
  explanation: string;
}

/** A single metric within a category. */
export interface MetricScore {
  /** Metric identifier (e.g. 'github-stars', 'last-commit'). */
  id: string;

  /** Human-readable label. */
  label: string;

  /** Raw value from the data source. */
  rawValue: unknown;

  /** Normalized score 0–100. */
  normalizedScore: number;

  /** Weight within the category. */
  weight: number;

  /** Explanation of scoring logic. */
  explanation: string;
}

/** Aggregate trust score for a package. */
export interface TrustScore {
  /** Overall trust score 0–100. */
  overall: number;

  /** Trust level classification. */
  level: string;

  /** Breakdown by scoring category. */
  categories: CategoryScore[];

  /** Summary explanation. */
  summary: string;

  /** Timestamp when the score was calculated. */
  calculatedAt: string;
}

/** Weight definition for a scoring category. */
export interface WeightDefinition {
  /** Category identifier. */
  category: string;

  /** Display label. */
  label: string;

  /** Default weight 0–100. */
  defaultWeight: number;

  /** Description of what this weight controls. */
  description: string;
}
