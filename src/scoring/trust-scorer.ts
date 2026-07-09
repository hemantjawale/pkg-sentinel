/**
 * Trust scorer — the central scoring engine.
 * Calculates weighted trust scores from analyzer results.
 */

import type { IScoringEngine } from './interfaces.js';
import type { AnalyzerResult } from '../types/analysis.js';
import type { CategoryScore, TrustScore, WeightDefinition } from '../types/scores.js';
import { trustLevelFromScore, AnalysisCategory, Severity, SEVERITY_ORDER } from '../types/common.js';
import { DEFAULT_WEIGHTS, mergeWeights } from './weights.js';
import { CATEGORY_METADATA, SCORE_CATEGORIES } from './categories.js';

export class TrustScorer implements IScoringEngine {
  private weights: WeightDefinition[];

  constructor(overrides: Record<string, number> = {}) {
    this.weights = mergeWeights(overrides);
  }

  calculateTrustScore(results: AnalyzerResult[]): TrustScore {
    const categories: CategoryScore[] = [];

    for (const weight of this.weights) {
      const categoryScore = this.calculateCategoryScore(weight.category, results);
      categories.push(categoryScore);
    }

    // Calculate weighted overall score
    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
    const overall = totalWeight > 0
      ? Math.round(
          categories.reduce((sum, c) => sum + c.weightedScore, 0) / totalWeight * 100,
        )
      : 0;

    const clampedOverall = Math.max(0, Math.min(100, overall));

    return {
      overall: clampedOverall,
      level: trustLevelFromScore(clampedOverall),
      categories,
      summary: this.generateSummary(clampedOverall, categories),
      calculatedAt: new Date().toISOString(),
    };
  }

  calculateCategoryScore(
    category: string,
    results: AnalyzerResult[],
  ): CategoryScore {
    const weight = this.weights.find((w) => w.category === category);
    if (!weight) {
      return {
        category,
        label: category,
        score: 50,
        weight: 0,
        weightedScore: 0,
        metrics: [],
        explanation: 'No weight configured for this category',
      };
    }

    const meta = CATEGORY_METADATA[category as keyof typeof CATEGORY_METADATA];
    let score: number;
    let explanation: string;

    switch (category) {
      case SCORE_CATEGORIES.HEALTH:
        ({ score, explanation } = this.scoreHealth(results));
        break;
      case SCORE_CATEGORIES.MAINTAINER_TRUST:
        ({ score, explanation } = this.scoreMaintainerTrust(results));
        break;
      case SCORE_CATEGORIES.SUPPLY_CHAIN:
        ({ score, explanation } = this.scoreSupplyChain(results));
        break;
      case SCORE_CATEGORIES.INSTALL_SCRIPTS:
        ({ score, explanation } = this.scoreInstallScripts(results));
        break;
      case SCORE_CATEGORIES.COMMUNITY:
        ({ score, explanation } = this.scoreCommunity(results));
        break;
      case SCORE_CATEGORIES.PACKAGE_AGE:
        ({ score, explanation } = this.scorePackageAge(results));
        break;
      case SCORE_CATEGORIES.RELEASE_QUALITY:
        ({ score, explanation } = this.scoreReleaseQuality(results));
        break;
      case SCORE_CATEGORIES.RISK_INDICATORS:
        ({ score, explanation } = this.scoreRiskIndicators(results));
        break;
      default:
        score = 50;
        explanation = 'Unknown category';
    }

    const clampedScore = Math.max(0, Math.min(100, score));

    return {
      category,
      label: meta?.label ?? category,
      score: clampedScore,
      weight: weight.defaultWeight,
      weightedScore: clampedScore * weight.defaultWeight / 100,
      metrics: [],
      explanation,
    };
  }

  getWeights(): WeightDefinition[] {
    return [...this.weights];
  }

  setWeights(overrides: Record<string, number>): void {
    this.weights = mergeWeights(overrides);
  }

  private scoreHealth(results: AnalyzerResult[]): { score: number; explanation: string } {
    const healthResult = results.find((r) => r.category === AnalysisCategory.Health);
    if (!healthResult || healthResult.status !== 'completed') {
      return { score: 50, explanation: 'Health data unavailable' };
    }

    const metricScores = healthResult.metadata['metricScores'] as
      Array<{ normalizedScore: number; weight: number }> | undefined;

    if (!metricScores || metricScores.length === 0) {
      return { score: 50, explanation: 'No health metrics available' };
    }

    const totalWeight = metricScores.reduce((s, m) => s + m.weight, 0);
    const weightedSum = metricScores.reduce((s, m) => s + m.normalizedScore * m.weight, 0);
    const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

    return {
      score,
      explanation: `Health score based on ${metricScores.length} metrics`,
    };
  }

  private scoreMaintainerTrust(results: AnalyzerResult[]): { score: number; explanation: string } {
    const scResult = results.find((r) => r.category === AnalysisCategory.SupplyChain);
    if (!scResult) return { score: 70, explanation: 'Supply chain data unavailable' };

    const metrics = scResult.metadata['metrics'] as Record<string, unknown> | undefined;
    if (!metrics) return { score: 70, explanation: 'No supply chain metrics' };

    let score = 100;
    const reasons: string[] = [];

    // Penalize for maintainer changes
    const maintainerChanges = (metrics['maintainerChanges'] as unknown[])?.length ?? 0;
    if (maintainerChanges > 3) {
      score -= 30;
      reasons.push(`${maintainerChanges} maintainer changes`);
    } else if (maintainerChanges > 0) {
      score -= 10;
      reasons.push(`${maintainerChanges} maintainer change(s)`);
    }

    // Penalize for publisher changes
    const publisherChanges = (metrics['publisherChanges'] as unknown[])?.length ?? 0;
    if (publisherChanges > 2) {
      score -= 25;
      reasons.push(`${publisherChanges} publisher changes`);
    } else if (publisherChanges > 0) {
      score -= 10;
      reasons.push(`${publisherChanges} publisher change(s)`);
    }

    return {
      score: Math.max(0, score),
      explanation: reasons.length > 0
        ? `Deductions: ${reasons.join(', ')}`
        : 'No concerning maintainer activity',
    };
  }

  private scoreSupplyChain(results: AnalyzerResult[]): { score: number; explanation: string } {
    const scResult = results.find((r) => r.category === AnalysisCategory.SupplyChain);
    if (!scResult) return { score: 70, explanation: 'Supply chain data unavailable' };

    const metrics = scResult.metadata['metrics'] as Record<string, unknown> | undefined;
    if (!metrics) return { score: 70, explanation: 'No metrics' };

    let score = 100;
    const reasons: string[] = [];

    // Provenance bonus/penalty
    if (metrics['hasProvenance'] === true) {
      reasons.push('Has publishing provenance ✓');
    } else if (metrics['hasProvenance'] === false) {
      score -= 15;
      reasons.push('No publishing provenance');
    }

    // Integrity hash
    if (!metrics['integrityHash']) {
      score -= 10;
      reasons.push('Missing integrity hash');
    }

    // Timing anomalies
    const timingAnomalies = (metrics['releaseTimingAnomalies'] as string[])?.length ?? 0;
    if (timingAnomalies > 0) {
      score -= timingAnomalies * 5;
      reasons.push(`${timingAnomalies} timing anomaly(s)`);
    }

    return {
      score: Math.max(0, score),
      explanation: reasons.join('; '),
    };
  }

  private scoreInstallScripts(results: AnalyzerResult[]): { score: number; explanation: string } {
    const scriptResult = results.find((r) => r.category === AnalysisCategory.InstallScripts);
    if (!scriptResult) return { score: 100, explanation: 'No install script data' };

    if (scriptResult.metadata['hasInstallScripts'] === false) {
      return { score: 100, explanation: 'No install scripts — safest configuration' };
    }

    // Penalize based on severity of findings
    let score = 100;
    const allFindings = scriptResult.findings;

    for (const finding of allFindings) {
      const penalty = SEVERITY_ORDER[finding.severity] * 10;
      score -= penalty;
    }

    return {
      score: Math.max(0, score),
      explanation: allFindings.length > 0
        ? `${allFindings.length} finding(s) in install scripts`
        : 'Install scripts present but no dangerous patterns detected',
    };
  }

  private scoreCommunity(results: AnalyzerResult[]): { score: number; explanation: string } {
    const healthResult = results.find((r) => r.category === AnalysisCategory.Health);
    const metrics = healthResult?.metadata['metrics'] as Record<string, unknown> | undefined;

    if (!metrics) return { score: 50, explanation: 'Community data unavailable' };

    const downloads = (metrics['weeklyDownloads'] as number) ?? 0;
    let score: number;
    if (downloads >= 1_000_000) score = 100;
    else if (downloads >= 100_000) score = 85;
    else if (downloads >= 10_000) score = 70;
    else if (downloads >= 1_000) score = 55;
    else if (downloads >= 100) score = 40;
    else score = 20;

    return {
      score,
      explanation: `${downloads.toLocaleString()} weekly downloads`,
    };
  }

  private scorePackageAge(results: AnalyzerResult[]): { score: number; explanation: string } {
    const healthResult = results.find((r) => r.category === AnalysisCategory.Health);
    const metrics = healthResult?.metadata['metrics'] as Record<string, unknown> | undefined;

    const ageDays = (metrics?.['repositoryAgeDays'] as number) ?? 0;
    let score: number;
    if (ageDays >= 1095) score = 100;
    else if (ageDays >= 365) score = 75;
    else if (ageDays >= 180) score = 55;
    else if (ageDays >= 90) score = 35;
    else score = 15;

    return {
      score,
      explanation: ageDays > 0
        ? `Package is ${(ageDays / 365).toFixed(1)} years old`
        : 'Age unknown',
    };
  }

  private scoreReleaseQuality(results: AnalyzerResult[]): { score: number; explanation: string } {
    const healthResult = results.find((r) => r.category === AnalysisCategory.Health);
    const metrics = healthResult?.metadata['metrics'] as Record<string, unknown> | undefined;

    const releaseFreq = (metrics?.['releaseFrequencyDays'] as number) ?? null;
    let score = 50;
    if (releaseFreq !== null) {
      if (releaseFreq <= 30) score = 90;
      else if (releaseFreq <= 90) score = 75;
      else if (releaseFreq <= 180) score = 55;
      else score = 30;
    }

    return {
      score,
      explanation: releaseFreq !== null
        ? `Average release every ${releaseFreq} days`
        : 'Release frequency unknown',
    };
  }

  private scoreRiskIndicators(results: AnalyzerResult[]): { score: number; explanation: string } {
    // Start at 100 and deduct for risk indicators
    let score = 100;
    const reasons: string[] = [];

    // Typosquatting findings
    const typoResult = results.find((r) => r.category === AnalysisCategory.Typosquatting);
    if (typoResult) {
      const typoResults = (typoResult.metadata['typosquatResults'] as unknown[]) ?? [];
      if (typoResults.length > 0) {
        score -= 30;
        reasons.push(`${typoResults.length} typosquatting match(es)`);
      }
      const brandResults = (typoResult.metadata['brandImpersonation'] as unknown[]) ?? [];
      if (brandResults.length > 0) {
        score -= 20;
        reasons.push(`${brandResults.length} brand impersonation match(es)`);
      }
    }

    // Exfiltration findings
    const exfilResult = results.find((r) => r.category === AnalysisCategory.Exfiltration);
    if (exfilResult) {
      const criticalFindings = exfilResult.findings.filter(
        (f) => f.severity === Severity.Critical,
      );
      if (criticalFindings.length > 0) {
        score -= 50;
        reasons.push(`${criticalFindings.length} critical exfiltration finding(s)`);
      }
    }

    return {
      score: Math.max(0, score),
      explanation: reasons.length > 0
        ? reasons.join('; ')
        : 'No risk indicators detected',
    };
  }

  private generateSummary(overall: number, categories: CategoryScore[]): string {
    const worst = categories
      .filter((c) => c.score < 50)
      .sort((a, b) => a.score - b.score);

    if (overall >= 80) {
      return 'This package appears trustworthy with strong health and security indicators.';
    } else if (overall >= 60) {
      const concerns = worst.map((c) => c.label).join(', ');
      return `This package has moderate trust. Areas of concern: ${concerns || 'general review recommended'}.`;
    } else if (overall >= 40) {
      const concerns = worst.map((c) => c.label).join(', ');
      return `This package has low trust. Significant concerns in: ${concerns}.`;
    } else {
      return 'This package has very low trust scores and should be carefully reviewed before use.';
    }
  }
}
