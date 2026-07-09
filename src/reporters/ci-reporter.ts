/**
 * CI reporter — provides CI-friendly exit codes based on findings.
 */

import type { IReporter } from './interfaces.js';
import type { AnalysisResult } from '../types/analysis.js';
import { ReportFormat, Severity, ExitCode } from '../types/common.js';

export class CiReporter implements IReporter {
  readonly format = ReportFormat.Json;
  readonly name = 'ci';

  async generate(result: AnalysisResult): Promise<string> {
    const summary = {
      package: `${result.packageName}@${result.packageVersion}`,
      trustScore: result.trustScore.overall,
      trustLevel: result.trustScore.level,
      highestSeverity: result.highestSeverity,
      findings: result.summary.totalFindings,
      exitCode: this.getExitCode(result),
    };
    return JSON.stringify(summary);
  }

  async output(result: AnalysisResult): Promise<void> {
    const output = await this.generate(result);
    process.stdout.write(output + '\n');
    process.exitCode = this.getExitCode(result);
  }

  private getExitCode(result: AnalysisResult): number {
    switch (result.highestSeverity) {
      case Severity.Critical:
        return ExitCode.CriticalRisk;
      case Severity.High:
        return ExitCode.HighRisk;
      case Severity.Medium:
      case Severity.Low:
        return ExitCode.Warnings;
      default:
        return ExitCode.Success;
    }
  }
}
