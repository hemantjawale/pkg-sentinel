/**
 * Reporter interfaces — format and output analysis results.
 */

import type { AnalysisResult } from '../types/analysis.js';
import type { ReportFormat } from '../types/common.js';

/** Interface for all output reporters. */
export interface IReporter {
  /** The output format this reporter produces. */
  readonly format: ReportFormat;

  /** Human-readable name. */
  readonly name: string;

  /**
   * Generate a report from analysis results.
   * Returns the formatted output as a string.
   */
  generate(result: AnalysisResult): Promise<string>;

  /**
   * Write the report to stdout or a file.
   */
  output(result: AnalysisResult, destination?: string): Promise<void>;
}
