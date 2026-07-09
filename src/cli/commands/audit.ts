/**
 * CLI command: audit
 * Scans all dependencies in the current project's package.json.
 */

import type { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '../ui/logger.js';

export function registerAuditCommand(program: Command): void {
  program
    .command('audit')
    .description('Audit all dependencies in the current project')
    .option('--prod', 'Only scan production dependencies')
    .option('--dev', 'Only scan dev dependencies')
    .option('--json', 'Output results as JSON')
    .option('--fail-on <severity>', 'Exit with error on severity threshold', 'high')
    .action(async (options: {
      prod?: boolean;
      dev?: boolean;
      json?: boolean;
      failOn: string;
    }) => {
      const logger = new Logger({ quiet: options.json });
      logger.banner();

      try {
        // Read package.json from CWD
        const pkgPath = join(process.cwd(), 'package.json');
        const content = await readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(content);

        const deps: Record<string, string> = {};

        if (!options.dev) {
          Object.assign(deps, pkg.dependencies ?? {});
        }
        if (!options.prod) {
          Object.assign(deps, pkg.devDependencies ?? {});
        }

        const packageNames = Object.keys(deps);
        logger.info(`Found ${packageNames.length} dependencies to audit`);

        // TODO: Run check for each package with progress tracking
        logger.info('Full audit scanning will be available in Milestone 2');
        logger.info(`Packages to scan: ${packageNames.slice(0, 10).join(', ')}${packageNames.length > 10 ? '...' : ''}`);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 10;
      }
    });
}
