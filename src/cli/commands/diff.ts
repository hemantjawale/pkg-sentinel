/**
 * CLI command: diff
 * Compare current dependencies against a saved snapshot.
 */

import type { Command } from 'commander';
import { Logger } from '../ui/logger.js';

export function registerDiffCommand(program: Command): void {
  program
    .command('diff')
    .description('Compare current state against a saved snapshot')
    .option('--snapshot <path>', 'Snapshot file to compare against', '.pkg-sentinel-snapshot.json')
    .action(async (options: { snapshot: string }) => {
      const logger = new Logger();
      logger.banner();

      logger.info(`Comparing against snapshot: ${options.snapshot}`);
      logger.info('Diff functionality will be available in Milestone 4.');
    });
}
