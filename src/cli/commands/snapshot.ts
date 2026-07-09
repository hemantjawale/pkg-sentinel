/**
 * CLI command: snapshot
 * Save a trusted dependency snapshot for future comparison.
 */

import type { Command } from 'commander';
import { Logger } from '../ui/logger.js';

export function registerSnapshotCommand(program: Command): void {
  program
    .command('snapshot')
    .description('Save a trusted dependency snapshot')
    .option('--output <path>', 'Output file path', '.pkg-sentinel-snapshot.json')
    .action(async (options: { output: string }) => {
      const logger = new Logger();
      logger.banner();

      logger.info(`Saving dependency snapshot to ${options.output}...`);
      logger.info('Snapshot functionality will be available in Milestone 4.');
    });
}
