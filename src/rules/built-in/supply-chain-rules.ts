/**
 * Built-in supply chain rules.
 */

import type { IRule, RuleEvaluationData } from '../interfaces.js';
import type { Finding } from '../../types/analysis.js';
import { AnalysisCategory, Severity } from '../../types/common.js';
import { EvidenceType } from '../../types/analysis.js';

class PublisherChangeRule implements IRule {
  readonly id = 'supply-chain/publisher-change';
  readonly name = 'Publisher Changed';
  readonly description = 'The npm publisher has changed in recent versions';
  readonly category = AnalysisCategory.SupplyChain;
  readonly defaultSeverity = Severity.High;

  evaluate(data: RuleEvaluationData): Finding[] {
    const metrics = data.supplyChainMetrics as Record<string, unknown> | undefined;
    const changes = (metrics?.['publisherChanges'] as Array<Record<string, string>>) ?? [];
    if (changes.length === 0) return [];

    return changes.map((change) => ({
      ruleId: this.id,
      title: this.name,
      description: `Publisher changed from "${change['previousPublisher']}" to "${change['newPublisher']}" in version ${change['version']}`,
      severity: this.defaultSeverity,
      category: this.category,
      evidence: [{
        type: EvidenceType.Timeline,
        description: 'Publisher change',
        value: `${change['previousPublisher']} → ${change['newPublisher']}`,
      }],
      remediation: 'Verify the publisher change was intentional. Check if the package was transferred.',
      confidence: 90,
      metadata: change,
    }));
  }
}

class NoProvenanceRule implements IRule {
  readonly id = 'supply-chain/no-provenance';
  readonly name = 'No Publishing Provenance';
  readonly description = 'Package lacks SLSA/Sigstore provenance attestation';
  readonly category = AnalysisCategory.SupplyChain;
  readonly defaultSeverity = Severity.Low;

  evaluate(data: RuleEvaluationData): Finding[] {
    const metrics = data.supplyChainMetrics as Record<string, unknown> | undefined;
    if (metrics?.['hasProvenance'] !== false) return [];

    return [{
      ruleId: this.id,
      title: this.name,
      description: 'This package does not have publishing provenance (SLSA/Sigstore attestation)',
      severity: this.defaultSeverity,
      category: this.category,
      evidence: [{ type: EvidenceType.Metadata, description: 'Provenance', value: 'absent' }],
      remediation: 'Consider requesting the maintainer enable provenance attestation via GitHub Actions.',
      confidence: 100,
      metadata: {},
    }];
  }
}

class SizeAnomalyRule implements IRule {
  readonly id = 'supply-chain/size-anomaly';
  readonly name = 'Package Size Anomaly';
  readonly description = 'Significant unexpected change in package size';
  readonly category = AnalysisCategory.SupplyChain;
  readonly defaultSeverity = Severity.Medium;

  evaluate(data: RuleEvaluationData): Finding[] {
    const metrics = data.supplyChainMetrics as Record<string, unknown> | undefined;
    const current = metrics?.['packageSizeBytes'] as number | undefined;
    const previous = metrics?.['previousPackageSizeBytes'] as number | undefined;

    if (!current || !previous || previous === 0) return [];

    const changePercent = ((current - previous) / previous) * 100;

    // Flag if size increased by more than 200% or decreased by more than 50%
    if (changePercent > 200) {
      return [{
        ruleId: this.id,
        title: 'Package Size Increased Significantly',
        description: `Package size increased by ${changePercent.toFixed(0)}% (${previous} → ${current} bytes)`,
        severity: Severity.Medium,
        category: this.category,
        evidence: [{
          type: EvidenceType.Comparison,
          description: 'Size change',
          value: `${previous} → ${current} bytes (+${changePercent.toFixed(0)}%)`,
        }],
        remediation: 'Review the changelog for the latest version to understand the size increase.',
        confidence: 75,
        metadata: { current, previous, changePercent },
      }];
    }

    return [];
  }
}

export function getSupplyChainRules(): IRule[] {
  return [
    new PublisherChangeRule(),
    new NoProvenanceRule(),
    new SizeAnomalyRule(),
  ];
}
