/**
 * AI prompt builder — constructs structured prompts from analysis results.
 * The prompt explicitly constrains the AI to only summarize existing findings.
 */

import type { AnalysisResult } from '../types/analysis.js';

/**
 * Build a structured prompt for the AI explainer.
 */
export function buildExplanationPrompt(result: AnalysisResult): string {
  const sections: string[] = [];

  sections.push(`You are a security expert reviewing npm package analysis results.`);
  sections.push(`You MUST only summarize the analysis data provided below.`);
  sections.push(`You MUST NOT invent findings, evidence, or risk factors that are not in the data.`);
  sections.push(`You MUST NOT fabricate package alternatives unless they are well-known.`);
  sections.push('');

  sections.push(`# Package: ${result.packageName}@${result.packageVersion}`);
  sections.push(`# Trust Score: ${result.trustScore.overall}/100 (${result.trustScore.level})`);
  sections.push('');

  // Score breakdown
  sections.push('## Score Breakdown');
  for (const cat of result.trustScore.categories) {
    sections.push(`- ${cat.label}: ${cat.score}/100 — ${cat.explanation}`);
  }
  sections.push('');

  // Findings
  if (result.findings.length > 0) {
    sections.push(`## Findings (${result.findings.length})`);
    for (const finding of result.findings) {
      sections.push(`- [${finding.severity.toUpperCase()}] ${finding.title}: ${finding.description}`);
      if (finding.remediation) {
        sections.push(`  Remediation: ${finding.remediation}`);
      }
    }
    sections.push('');
  } else {
    sections.push('## Findings: None');
    sections.push('');
  }

  // Summary
  sections.push(`## Analysis Summary`);
  sections.push(`- Analyzers run: ${result.summary.analyzersRun}`);
  sections.push(`- Total findings: ${result.summary.totalFindings}`);
  sections.push(`- Duration: ${result.totalDurationMs}ms`);
  sections.push('');

  sections.push('## Instructions');
  sections.push('Based ONLY on the data above, provide:');
  sections.push('1. A brief risk summary (2-3 sentences)');
  sections.push('2. A developer-friendly explanation of the key risks');
  sections.push('3. Concrete remediation steps');
  sections.push('4. Alternative packages (only if you are confident they exist)');
  sections.push('5. Whether this package should be used (with reasoning)');

  return sections.join('\n');
}
