/**
 * CLI command: diff
 * Compare current dependencies against a saved snapshot.
 */

import type { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import chalk from 'chalk';
import { Logger } from '../ui/logger.js';
import { Spinner } from '../ui/spinner.js';
import { loadConfig } from '../../config/loader.js';
import { NpmProvider } from '../../providers/npm/npm-provider.js';
import { CacheManager } from '../../providers/cache/cache-manager.js';
import { SnapshotManager } from '../../snapshot/snapshot-manager.js';
import { diffSnapshots } from '../../snapshot/diff-engine.js';
import type { SnapshotEntry, DependencySnapshot } from '../../snapshot/types.js';
import { getNpmUsername } from '../../providers/npm/types.js';

export function registerDiffCommand(program: Command): void {
  program
    .command('diff')
    .description('Compare current project dependencies against a saved snapshot')
    .option('--snapshot <path>', 'Snapshot file to compare against', '.pkg-sentinel-snapshot.json')
    .option('--no-cache', 'Disable caching')
    .action(async (options: { snapshot: string; cache?: boolean }) => {
      const logger = new Logger();
      const spinner = new Spinner();

      logger.banner();

      try {
        const snapshotManager = new SnapshotManager();
        if (!(await snapshotManager.exists(options.snapshot))) {
          throw new Error(`Snapshot file "${options.snapshot}" does not exist. Save a snapshot first with "pkg-sentinel snapshot".`);
        }

        spinner.start(`Loading snapshot: ${options.snapshot}...`);
        const previousSnapshot = await snapshotManager.load(options.snapshot);

        spinner.update('Reading current package.json dependencies...');
        const pkgPath = join(process.cwd(), 'package.json');
        let pkg: { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
        try {
          const content = await pkgPath; // just checking existence
          const fileContent = await readFile(pkgPath, 'utf-8');
          pkg = JSON.parse(fileContent);
        } catch {
          throw new Error('package.json not found in current directory.');
        }

        const deps = {
          ...(pkg.dependencies ?? {}),
          ...(pkg.devDependencies ?? {}),
        };

        const packageNames = Object.keys(deps);

        spinner.update('Fetching metadata for current dependencies...');
        const config = await loadConfig({
          cache: { enabled: options.cache !== false },
        });

        const cache = config.cache.enabled
          ? new CacheManager(config.cache.directory)
          : undefined;

        const npmProvider = new NpmProvider(cache);
        const currentEntries: SnapshotEntry[] = [];

        for (let i = 0; i < packageNames.length; i++) {
          const name = packageNames[i]!;
          spinner.update(`Fetching metadata for ${name} (${i + 1}/${packageNames.length})...`);

          try {
            const metadata = await npmProvider.getPackageMetadata(name);
            const latest = metadata['dist-tags']['latest'] ?? '';
            const versionData = metadata.versions[latest];

            if (!versionData) continue;

            currentEntries.push({
              name,
              version: latest,
              maintainers: metadata.maintainers.map(getNpmUsername),
              integrity: versionData.dist.integrity ?? null,
              hasInstallScripts: versionData.scripts
                ? ['preinstall', 'install', 'postinstall'].some((s) => versionData.scripts && s in versionData.scripts)
                : false,
              publisher: versionData._npmUser ? getNpmUsername(versionData._npmUser) : null,
              dependencies: Object.keys(versionData.dependencies ?? {}),
            });
          } catch (err) {
            logger.warn(`Could not fetch metadata for package "${name}": ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        const currentSnapshot: DependencySnapshot = {
          createdAt: new Date().toISOString(),
          name: pkg.name ?? 'anonymous-project',
          dependencies: currentEntries,
          metadata: { totalDependencies: currentEntries.length },
        };

        spinner.update('Calculating diff...');
        const diff = diffSnapshots(previousSnapshot, currentSnapshot);
        spinner.succeed('Diff completed');

        // Render Diff results
        let hasChanges = false;

        if (diff.added.length > 0) {
          hasChanges = true;
          logger.header('Added Dependencies');
          for (const entry of diff.added) {
            logger.success(`+ ${entry.name}@${entry.version} (publisher: ${entry.publisher ?? 'unknown'})`);
            if (entry.hasInstallScripts) {
              logger.warn(`  ⚠ ${entry.name} runs install scripts on installation!`);
            }
          }
        }

        if (diff.removed.length > 0) {
          hasChanges = true;
          logger.header('Removed Dependencies');
          for (const entry of diff.removed) {
            logger.error(`- ${entry.name}@${entry.version}`);
          }
        }

        if (diff.changed.length > 0) {
          hasChanges = true;
          logger.header('Modified Dependencies');
          for (const change of diff.changed) {
            logger.info(`▪ ${change.name}`);
            for (const desc of change.changes) {
              // Highlight high-risk changes
              if (desc.includes('publisher') || desc.includes('maintainer') || desc.includes('install scripts added')) {
                logger.warn(`  ⚠ ${desc}`);
              } else {
                logger.debug(`  → ${desc}`);
              }
            }
          }
        }

        if (!hasChanges) {
          logger.success(chalk.green('No changes detected since last snapshot. All dependencies match.'));
        }
      } catch (error) {
        spinner.fail('Diff failed');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 10;
      }
    });
}
