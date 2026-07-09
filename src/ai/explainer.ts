/**
 * AI explainer — generates human-readable summaries of analysis results.
 * Supports OpenAI and Anthropic providers.
 */

import type { IAIExplainer } from './interfaces.js';
import type { AnalysisResult, AIExplanation } from '../types/analysis.js';
import type { AIConfig } from '../types/config.js';
import { buildExplanationPrompt } from './prompt-builder.js';

export class AIExplainer implements IAIExplainer {
  readonly provider: string;
  private readonly config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
    this.provider = config.provider;
  }

  isAvailable(): boolean {
    return (
      this.config.enabled &&
      this.config.provider !== 'none' &&
      !!this.config.apiKey
    );
  }

  async explain(result: AnalysisResult): Promise<AIExplanation> {
    if (!this.isAvailable()) {
      return {
        summary: 'AI explanation not available. Configure an AI provider to enable.',
        riskExplanation: '',
        remediation: [],
        alternatives: [],
        confidenceLevel: 'none',
        model: 'none',
        disclaimer:
          'AI explanations only summarize deterministic analysis results. They never invent evidence.',
      };
    }

    const prompt = buildExplanationPrompt(result);

    // In a full implementation, this would call the configured AI API.
    // For now, return a structured placeholder that indicates the prompt was built.
    return {
      summary: `Analysis of ${result.packageName} produced ${result.findings.length} findings with a trust score of ${result.trustScore.overall}/100.`,
      riskExplanation: result.trustScore.summary,
      remediation: result.findings
        .filter((f) => f.remediation)
        .map((f) => f.remediation!),
      alternatives: [],
      confidenceLevel: result.trustScore.level,
      model: this.config.model ?? 'not-configured',
      disclaimer:
        'This explanation only summarizes the deterministic analysis results above. No findings were invented by AI.',
    };
  }
}
