/**
 * CLI command: report
 * Generate reports in various formats.
 */

import type { Command } from 'commander';
import { Logger } from '../ui/logger.js';

export function registerReportCommand(program: Command): void {
  program
    .command('report')
    .description('Generate a report from the last analysis')
    .option('--json', 'Output as JSON')
    .option('--html', 'Output as HTML')
    .option('--markdown', 'Output as Markdown')
    .option('--output <path>', 'Write report to file')
    .action(async (options: {
      json?: boolean;
      html?: boolean;
      markdown?: boolean;
      output?: string;
    }) => {
      const logger = new Logger();
      logger.banner();

      const format = options.json ? 'JSON' : options.html ? 'HTML' : options.markdown ? 'Markdown' : 'Terminal';
      logger.info(`Generating ${format} report...`);

      if (options.output) {
        logger.info(`Output: ${options.output}`);
      }

      logger.info('Use "pkg-sentinel check <package> --json" for JSON output.');
      logger.info('Full report generation will be available in Milestone 4.');
    });
}
