/**
 * Terminal reporter — renders analysis results to stdout.
 */

import type { IReporter } from './interfaces.js';
import type { AnalysisResult } from '../types/analysis.js';
import { ReportFormat } from '../types/common.js';
import { Logger } from '../cli/ui/logger.js';
import { renderTrustBadge } from '../cli/ui/badges.js';
import { renderScoreTable, renderFindingsTable } from '../cli/ui/table.js';
import { formatDuration } from '../utils/validation.js';

export class TerminalReporter implements IReporter {
  readonly format = ReportFormat.Terminal;
  readonly name = 'terminal';

  async generate(result: AnalysisResult): Promise<string> {
    const lines: string[] = [];

    // Trust badge
    lines.push(renderTrustBadge(result.trustScore.overall, result.trustScore.level));

    // Package info
    lines.push(`  Package: ${result.packageName}@${result.packageVersion}`);
    lines.push(`  Analyzed: ${new Date(result.analyzedAt).toLocaleString()}`);
    lines.push(`  Duration: ${formatDuration(result.totalDurationMs)}`);
    lines.push('');

    // Score breakdown
    lines.push('  Score Breakdown');
    lines.push('  ──────────────');
    lines.push(renderScoreTable(result.trustScore.categories));

    // Findings
    if (result.findings.length > 0) {
      lines.push(`  Findings (${result.findings.length})`);
      lines.push('  ────────');
      lines.push(renderFindingsTable(result.findings));
    } else {
      lines.push('  ✅ No security findings detected.\n');
    }

    // Summary
    lines.push(`  ${result.trustScore.summary}`);
    lines.push('');

    return lines.join('\n');
  }

  async output(result: AnalysisResult, _destination?: string): Promise<void> {
    const report = await this.generate(result);
    process.stdout.write(report);
  }
}
