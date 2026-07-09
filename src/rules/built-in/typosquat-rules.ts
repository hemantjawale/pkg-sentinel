/**
 * Built-in typosquatting rules.
 */

import type { IRule, RuleEvaluationData } from '../interfaces.js';
import type { Finding } from '../../types/analysis.js';
import { AnalysisCategory, Severity } from '../../types/common.js';
import { EvidenceType } from '../../types/analysis.js';

class TyposquatDetectionRule implements IRule {
  readonly id = 'typosquat/similar-name';
  readonly name = 'Potential Typosquat';
  readonly description = 'Package name is suspiciously similar to a popular package';
  readonly category = AnalysisCategory.Typosquatting;
  readonly defaultSeverity = Severity.High;

  evaluate(data: RuleEvaluationData): Finding[] {
    const typoData = data.typosquatData as Record<string, unknown> | undefined;
    const results = (typoData?.['typosquatResults'] as Array<Record<string, unknown>>) ?? [];
    if (results.length === 0) return [];

    return results.map((result) => {
      const confidence = (result['confidence'] as number) ?? 50;
      let severity: Severity;
      if (confidence >= 90) severity = Severity.Critical;
      else if (confidence >= 75) severity = Severity.High;
      else severity = Severity.Medium;

      return {
        ruleId: this.id,
        title: `Potential Typosquat of "${result['legitimatePackage']}"`,
        description: `Package name "${data.packageName}" is similar to popular package "${result['legitimatePackage']}" (similarity: ${((result['similarity'] as number) * 100).toFixed(0)}%, distance: ${result['distance']})`,
        severity,
        category: this.category,
        evidence: [{
          type: EvidenceType.Comparison,
          description: 'Package name similarity',
          value: `"${data.packageName}" vs "${result['legitimatePackage']}"`,
        }],
        remediation: `Verify you intended to install "${data.packageName}" and not "${result['legitimatePackage']}".`,
        confidence,
        metadata: result,
      };
    });
  }
}

class BrandImpersonationRule implements IRule {
  readonly id = 'typosquat/brand-impersonation';
  readonly name = 'Brand Impersonation';
  readonly description = 'Package name contains well-known brand name with suspicious modifications';
  readonly category = AnalysisCategory.Typosquatting;
  readonly defaultSeverity = Severity.Medium;

  evaluate(data: RuleEvaluationData): Finding[] {
    const typoData = data.typosquatData as Record<string, unknown> | undefined;
    const results = (typoData?.['brandImpersonation'] as Array<Record<string, unknown>>) ?? [];
    if (results.length === 0) return [];

    return results.map((result) => ({
      ruleId: this.id,
      title: `Potential "${result['brand']}" Brand Impersonation`,
      description: (result['reason'] as string) ?? 'Suspicious use of brand name',
      severity: this.defaultSeverity,
      category: this.category,
      evidence: [{
        type: EvidenceType.Comparison,
        description: 'Brand name match',
        value: `Brand: "${result['brand']}" in package: "${result['packageName']}"`,
      }],
      remediation: 'Verify this package is officially associated with the brand.',
      confidence: (result['confidence'] as number) ?? 70,
      metadata: result,
    }));
  }
}

export function getTyposquatRules(): IRule[] {
  return [
    new TyposquatDetectionRule(),
    new BrandImpersonationRule(),
  ];
}
