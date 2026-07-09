/**
 * Built-in install script rules.
 */

import type { IRule, RuleEvaluationData } from '../interfaces.js';
import type { Finding } from '../../types/analysis.js';
import { AnalysisCategory, Severity } from '../../types/common.js';
import { EvidenceType } from '../../types/analysis.js';

class HasInstallScriptsRule implements IRule {
  readonly id = 'scripts/has-install-scripts';
  readonly name = 'Has Install Scripts';
  readonly description = 'Package defines preinstall, install, or postinstall scripts';
  readonly category = AnalysisCategory.InstallScripts;
  readonly defaultSeverity = Severity.Info;

  evaluate(data: RuleEvaluationData): Finding[] {
    const scriptData = data.scriptResults as Record<string, unknown> | undefined;
    if (scriptData?.['hasInstallScripts'] !== true) return [];

    return [{
      ruleId: this.id,
      title: this.name,
      description: 'This package has install lifecycle scripts that run during npm install',
      severity: this.defaultSeverity,
      category: this.category,
      evidence: [{ type: EvidenceType.Metadata, description: 'Install scripts', value: 'present' }],
      remediation: 'Review the install scripts to ensure they are safe. Use --ignore-scripts if uncertain.',
      confidence: 100,
      metadata: {},
    }];
  }
}

class DangerousScriptPatternRule implements IRule {
  readonly id = 'scripts/dangerous-pattern';
  readonly name = 'Dangerous Install Script Pattern';
  readonly description = 'Install script contains patterns known to be used in supply-chain attacks';
  readonly category = AnalysisCategory.InstallScripts;
  readonly defaultSeverity = Severity.Critical;

  evaluate(data: RuleEvaluationData): Finding[] {
    const scriptData = data.scriptResults as Record<string, unknown> | undefined;
    const scriptResults = (scriptData?.['scriptResults'] as Array<Record<string, unknown>>) ?? [];

    const findings: Finding[] = [];

    for (const result of scriptResults) {
      const combinations = (result['suspiciousCombinations'] as Array<Record<string, unknown>>) ?? [];
      for (const combo of combinations) {
        findings.push({
          ruleId: this.id,
          title: 'Suspicious Script Combination',
          description: (combo['reason'] as string) ?? 'Dangerous pattern detected',
          severity: (combo['severity'] as Severity) ?? Severity.High,
          category: this.category,
          evidence: [{
            type: EvidenceType.CodeSnippet,
            description: 'Detection combination',
            value: ((combo['detections'] as string[]) ?? []).join(' + '),
            source: result['hook'] as string,
          }],
          remediation: 'Do NOT install this package without thorough review of its install scripts.',
          confidence: 90,
          metadata: { hook: result['hook'], combination: combo },
        });
      }
    }

    return findings;
  }
}

export function getScriptRules(): IRule[] {
  return [
    new HasInstallScriptsRule(),
    new DangerousScriptPatternRule(),
  ];
}
