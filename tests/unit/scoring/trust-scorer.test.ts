/**
 * Tests for the trust scoring engine.
 */

import { describe, it, expect } from 'vitest';
import { TrustScorer } from '../../../src/scoring/trust-scorer.js';
import type { AnalyzerResult } from '../../../src/types/analysis.js';
import { AnalysisCategory, AnalysisStatus, Severity } from '../../../src/types/common.js';

function makeResult(
  category: AnalysisCategory,
  metadata: Record<string, unknown> = {},
  findings: AnalyzerResult['findings'] = [],
): AnalyzerResult {
  return {
    analyzer: category,
    category,
    status: AnalysisStatus.Completed,
    findings,
    durationMs: 100,
    metadata,
  };
}

describe('TrustScorer', () => {
  it('calculates trust score from analyzer results', () => {
    const scorer = new TrustScorer();
    const results: AnalyzerResult[] = [
      makeResult(AnalysisCategory.Health, {
        metrics: { weeklyDownloads: 100000, repositoryAgeDays: 1000 },
        metricScores: [
          { normalizedScore: 80, weight: 10 },
          { normalizedScore: 90, weight: 10 },
        ],
      }),
      makeResult(AnalysisCategory.SupplyChain, {
        metrics: {
          maintainerChanges: [],
          publisherChanges: [],
          hasProvenance: true,
          integrityHash: 'sha512-abc',
          releaseTimingAnomalies: [],
        },
      }),
      makeResult(AnalysisCategory.InstallScripts, {
        hasInstallScripts: false,
      }),
      makeResult(AnalysisCategory.Typosquatting, {
        typosquatResults: [],
        brandImpersonation: [],
      }),
      makeResult(AnalysisCategory.Exfiltration),
    ];

    const score = scorer.calculateTrustScore(results);

    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.level).toBeTruthy();
    expect(score.categories.length).toBeGreaterThan(0);
    expect(score.summary).toBeTruthy();
    expect(score.calculatedAt).toBeTruthy();
  });

  it('returns lower score when install scripts have findings', () => {
    const scorer = new TrustScorer();

    const cleanResults: AnalyzerResult[] = [
      makeResult(AnalysisCategory.InstallScripts, { hasInstallScripts: false }),
    ];
    const dirtyResults: AnalyzerResult[] = [
      makeResult(
        AnalysisCategory.InstallScripts,
        { hasInstallScripts: true },
        [
          {
            ruleId: 'test',
            title: 'Test',
            description: 'Test finding',
            severity: Severity.Critical,
            category: AnalysisCategory.InstallScripts,
            evidence: [],
            confidence: 90,
            metadata: {},
          },
        ],
      ),
    ];

    const cleanScore = scorer.calculateTrustScore(cleanResults);
    const dirtyScore = scorer.calculateTrustScore(dirtyResults);

    // The install script category score should be lower with findings
    const cleanScriptCategory = cleanScore.categories.find(
      (c) => c.category === 'install-scripts',
    );
    const dirtyScriptCategory = dirtyScore.categories.find(
      (c) => c.category === 'install-scripts',
    );

    expect(cleanScriptCategory!.score).toBeGreaterThan(dirtyScriptCategory!.score);
  });

  it('allows weight customization', () => {
    const scorer = new TrustScorer({ health: 50, 'supply-chain': 50 });
    const weights = scorer.getWeights();

    const healthWeight = weights.find((w) => w.category === 'health');
    expect(healthWeight!.defaultWeight).toBe(50);
  });

  it('generates appropriate trust levels', () => {
    const scorer = new TrustScorer();

    // High-quality package should get high score
    const results: AnalyzerResult[] = [
      makeResult(AnalysisCategory.Health, {
        metrics: { weeklyDownloads: 10000000, repositoryAgeDays: 2000 },
        metricScores: Array.from({ length: 12 }, () => ({ normalizedScore: 95, weight: 10 })),
      }),
      makeResult(AnalysisCategory.SupplyChain, {
        metrics: {
          maintainerChanges: [],
          publisherChanges: [],
          hasProvenance: true,
          integrityHash: 'sha512-abc',
          releaseTimingAnomalies: [],
        },
      }),
      makeResult(AnalysisCategory.InstallScripts, { hasInstallScripts: false }),
      makeResult(AnalysisCategory.Typosquatting, { typosquatResults: [], brandImpersonation: [] }),
      makeResult(AnalysisCategory.Exfiltration),
    ];

    const score = scorer.calculateTrustScore(results);
    expect(score.overall).toBeGreaterThanOrEqual(70);
  });
});
