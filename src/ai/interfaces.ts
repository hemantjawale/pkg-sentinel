/**
 * AI explainer interface.
 * AI is ONLY used to summarize deterministic analysis results.
 * It must NEVER invent evidence or fabricate findings.
 */

import type { AnalysisResult, AIExplanation } from '../types/analysis.js';

/** Interface for AI explanation providers. */
export interface IAIExplainer {
  /** Provider name (e.g. 'openai', 'anthropic'). */
  readonly provider: string;

  /** Whether the AI provider is configured and available. */
  isAvailable(): boolean;

  /**
   * Generate a human-readable explanation of the analysis results.
   * The AI must ONLY summarize the provided analysis data.
   * It must NOT invent findings, evidence, or risk factors.
   */
  explain(result: AnalysisResult): Promise<AIExplanation>;
}
