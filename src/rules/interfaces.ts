/**
 * Rules engine interfaces.
 * Rules are deterministic, explainable detection units.
 */

import type { Finding } from '../types/analysis.js';
import type { AnalysisCategory, Severity } from '../types/common.js';

/** A single rule definition. */
export interface IRule {
  /** Unique rule identifier (e.g. 'health/stale-repository'). */
  readonly id: string;

  /** Human-readable name. */
  readonly name: string;

  /** Detailed description. */
  readonly description: string;

  /** Analysis category this rule belongs to. */
  readonly category: AnalysisCategory;

  /** Default severity when this rule triggers. */
  readonly defaultSeverity: Severity;

  /** URL for documentation about this rule. */
  readonly documentationUrl?: string;

  /**
   * Evaluate this rule against provided data.
   * Returns findings if the rule triggers, or an empty array if it doesn't.
   */
  evaluate(data: RuleEvaluationData): Finding[];
}

/** Data provided to rules for evaluation. */
export interface RuleEvaluationData {
  /** Package name being analyzed. */
  packageName: string;

  /** Package version being analyzed. */
  packageVersion: string;

  /** npm registry metadata. */
  npmData?: Record<string, unknown>;

  /** GitHub repository data. */
  githubData?: Record<string, unknown>;

  /** Health metrics. */
  healthMetrics?: Record<string, unknown>;

  /** Supply chain metrics. */
  supplyChainMetrics?: Record<string, unknown>;

  /** Install script analysis results. */
  scriptResults?: Record<string, unknown>;

  /** Typosquatting analysis data. */
  typosquatData?: Record<string, unknown>;

  /** Any additional data. */
  [key: string]: unknown;
}

/** Interface for the rule engine that orchestrates rule evaluation. */
export interface IRuleEngine {
  /** Evaluate all applicable rules against the data. */
  evaluate(data: RuleEvaluationData): Finding[];

  /** Register a new rule. */
  registerRule(rule: IRule): void;

  /** Get all registered rules. */
  getRules(): IRule[];

  /** Get a rule by its ID. */
  getRule(id: string): IRule | undefined;

  /** Disable a rule by ID. */
  disableRule(id: string): void;

  /** Enable a rule by ID. */
  enableRule(id: string): void;
}
