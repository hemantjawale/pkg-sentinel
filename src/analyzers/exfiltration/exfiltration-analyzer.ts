/**
 * Exfiltration analyzer — detects secret theft patterns.
 */

import type { IAnalyzer } from '../interfaces.js';
import type { AnalyzerResult, Finding } from '../../types/analysis.js';
import { AnalysisCategory, AnalysisStatus, Severity } from '../../types/common.js';
import { EvidenceType } from '../../types/analysis.js';
import type { AnalysisContext } from '../../core/context.js';
import { matchExfiltrationPatterns } from './pattern-matcher.js';

export class ExfiltrationAnalyzer implements IAnalyzer {
  readonly name = 'exfiltration';
  readonly description = 'Detects patterns indicating secret or credential exfiltration';
  readonly category = AnalysisCategory.Exfiltration;

  canAnalyze(context: AnalysisContext): boolean {
    // Requires script analysis results to have been run first
    return context.npmMetadata !== undefined;
  }

  async analyze(context: AnalysisContext): Promise<AnalyzerResult> {
    const start = Date.now();

    try {
      const findings: Finding[] = [];

      // Get script analysis detections from context
      const scriptResults = context.scriptAnalysisResults ?? [];

      for (const scriptResult of scriptResults) {
        const exfiltrationMatches = matchExfiltrationPatterns(
          scriptResult.detections,
        );

        for (const match of exfiltrationMatches) {
          findings.push({
            ruleId: 'exfiltration/data-theft-pattern',
            title: 'Potential Data Exfiltration Detected',
            description: match.reason,
            severity: match.severity,
            category: AnalysisCategory.Exfiltration,
            evidence: [
              {
                type: EvidenceType.Metadata,
                description: 'Detection combination',
                value: match.detections.join(' + '),
              },
              {
                type: EvidenceType.Metadata,
                description: 'Install script hook',
                value: scriptResult.hook,
              },
            ],
            remediation: 'Review the install scripts carefully. Consider blocking this package or contacting the maintainer.',
            confidence: 90,
            metadata: {
              hook: scriptResult.hook,
              matchedDetections: match.detections,
            },
          });
        }

        // Check for suspicious URL + credential combos
        const hasCredentialDetection = scriptResult.detections.some(
          (d) => ['npm-token', 'ssh-key-access', 'aws-key', 'github-token'].includes(d.type),
        );
        const hasSuspiciousUrl = scriptResult.detections.some(
          (d) => d.type === 'url-literal' && d.severity === Severity.Critical,
        );

        if (hasCredentialDetection && hasSuspiciousUrl) {
          findings.push({
            ruleId: 'exfiltration/suspicious-url-credential',
            title: 'Suspicious URL with Credential Access',
            description: 'Install script accesses credentials and contains suspicious URLs — high risk of data exfiltration',
            severity: Severity.Critical,
            category: AnalysisCategory.Exfiltration,
            evidence: scriptResult.detections
              .filter((d) => d.severity === Severity.Critical || d.severity === Severity.High)
              .map((d) => ({
                type: EvidenceType.CodeSnippet,
                description: d.description,
                value: d.codeSnippet ?? d.type,
                source: d.location?.file,
                line: d.location?.line,
              })),
            confidence: 95,
            metadata: { hook: scriptResult.hook },
          });
        }
      }

      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Completed,
        findings,
        durationMs: Date.now() - start,
        metadata: { patternsChecked: scriptResults.length },
      };
    } catch (error) {
      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Failed,
        findings: [],
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
        metadata: {},
      };
    }
  }
}
