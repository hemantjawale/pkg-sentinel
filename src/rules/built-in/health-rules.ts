/**
 * Built-in health rules.
 */

import type { IRule, RuleEvaluationData } from '../interfaces.js';
import type { Finding } from '../../types/analysis.js';
import { AnalysisCategory, Severity } from '../../types/common.js';
import { EvidenceType } from '../../types/analysis.js';

class StaleRepositoryRule implements IRule {
  readonly id = 'health/stale-repository';
  readonly name = 'Stale Repository';
  readonly description = 'Repository has not received commits in over 1 year';
  readonly category = AnalysisCategory.Health;
  readonly defaultSeverity = Severity.Medium;

  evaluate(data: RuleEvaluationData): Finding[] {
    const metrics = data.healthMetrics as Record<string, unknown> | undefined;
    const lastCommit = metrics?.['lastCommitDate'] as string | undefined;
    if (!lastCommit) return [];

    const daysSince = Math.floor(
      (Date.now() - new Date(lastCommit).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSince > 365) {
      return [{
        ruleId: this.id,
        title: this.name,
        description: `Last commit was ${daysSince} days ago (${(daysSince / 365).toFixed(1)} years)`,
        severity: daysSince > 730 ? Severity.High : this.defaultSeverity,
        category: this.category,
        evidence: [{ type: EvidenceType.Metadata, description: 'Last commit', value: lastCommit }],
        remediation: 'Consider finding an actively maintained alternative.',
        confidence: 100,
        metadata: { daysSinceLastCommit: daysSince },
      }];
    }
    return [];
  }
}

class ArchivedRepositoryRule implements IRule {
  readonly id = 'health/archived-repository';
  readonly name = 'Archived Repository';
  readonly description = 'Repository is archived and no longer maintained';
  readonly category = AnalysisCategory.Health;
  readonly defaultSeverity = Severity.High;

  evaluate(data: RuleEvaluationData): Finding[] {
    const metrics = data.healthMetrics as Record<string, unknown> | undefined;
    if (metrics?.['isArchived'] !== true) return [];

    return [{
      ruleId: this.id,
      title: this.name,
      description: 'The GitHub repository is archived. No further updates are expected.',
      severity: this.defaultSeverity,
      category: this.category,
      evidence: [{ type: EvidenceType.Metadata, description: 'Archived', value: 'true' }],
      remediation: 'Find an actively maintained fork or alternative package.',
      confidence: 100,
      metadata: {},
    }];
  }
}

class LowBusFactorRule implements IRule {
  readonly id = 'health/low-bus-factor';
  readonly name = 'Low Bus Factor';
  readonly description = 'Package depends heavily on a single contributor';
  readonly category = AnalysisCategory.Health;
  readonly defaultSeverity = Severity.Medium;

  evaluate(data: RuleEvaluationData): Finding[] {
    const metrics = data.healthMetrics as Record<string, unknown> | undefined;
    const busFactor = metrics?.['busFactorEstimate'] as number | undefined;
    if (busFactor === undefined || busFactor > 1) return [];

    return [{
      ruleId: this.id,
      title: this.name,
      description: 'Over 50% of contributions come from a single developer',
      severity: this.defaultSeverity,
      category: this.category,
      evidence: [{ type: EvidenceType.Metadata, description: 'Bus factor', value: String(busFactor) }],
      remediation: 'Monitor for maintainer abandonment. Consider contributing to reduce bus factor.',
      confidence: 85,
      metadata: { busFactor },
    }];
  }
}

export function getHealthRules(): IRule[] {
  return [
    new StaleRepositoryRule(),
    new ArchivedRepositoryRule(),
    new LowBusFactorRule(),
  ];
}
