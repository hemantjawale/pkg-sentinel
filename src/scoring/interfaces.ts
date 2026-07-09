/**
 * Scoring engine interfaces.
 */

import type { AnalyzerResult } from '../types/analysis.js';
import type { CategoryScore, TrustScore, WeightDefinition } from '../types/scores.js';

/** Interface for the trust scoring engine. */
export interface IScoringEngine {
  /**
   * Calculate the overall trust score from analyzer results.
   */
  calculateTrustScore(results: AnalyzerResult[]): TrustScore;

  /**
   * Calculate score for a single category.
   */
  calculateCategoryScore(
    category: string,
    results: AnalyzerResult[],
  ): CategoryScore;

  /**
   * Get all registered weight definitions.
   */
  getWeights(): WeightDefinition[];

  /**
   * Override default weights.
   */
  setWeights(overrides: Record<string, number>): void;
}

/** Interface for a category scorer — calculates score for a specific category. */
export interface ICategoryScorer {
  /** Category identifier. */
  readonly category: string;

  /** Human-readable label. */
  readonly label: string;

  /** Calculate the category score from relevant analyzer results. */
  score(results: AnalyzerResult[]): CategoryScore;
}
