/**
 * JSON reporter — outputs analysis results as machine-readable JSON.
 */

import { writeFile } from 'node:fs/promises';
import type { IReporter } from './interfaces.js';
import type { AnalysisResult } from '../types/analysis.js';
import { ReportFormat } from '../types/common.js';

export class JsonReporter implements IReporter {
  readonly format = ReportFormat.Json;
  readonly name = 'json';

  async generate(result: AnalysisResult): Promise<string> {
    return JSON.stringify(result, null, 2);
  }

  async output(result: AnalysisResult, destination?: string): Promise<void> {
    const json = await this.generate(result);
    if (destination) {
      await writeFile(destination, json, 'utf-8');
    } else {
      process.stdout.write(json + '\n');
    }
  }
}
