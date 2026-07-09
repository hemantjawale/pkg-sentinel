/**
 * CLI command: snapshot
 * Save a trusted dependency snapshot for future comparison.
 */

import type { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Logger } from '../ui/logger.js';
import { Spinner } from '../ui/spinner.js';
import { loadConfig } from '../../config/loader.js';
import { NpmProvider } from '../../providers/npm/npm-provider.js';
import { CacheManager } from '../../providers/cache/cache-manager.js';
import { SnapshotManager } from '../../snapshot/snapshot-manager.js';
import type { SnapshotEntry, DependencySnapshot } from '../../snapshot/types.js';
import { getNpmUsername } from '../../providers/npm/types.js';

export function registerSnapshotCommand(program: Command): void {
  program
    .command('snapshot')
    .description('Save a trusted dependency snapshot of project dependencies')
    .option('--output <path>', 'Output file path', '.pkg-sentinel-snapshot.json')
    .option('--no-cache', 'Disable caching')
    .action(async (options: { output: string; cache?: boolean }) => {
      const logger = new Logger();
      const spinner = new Spinner();

      logger.banner();

      try {
        spinner.start('Reading package.json dependencies...');

        // 1. Read package.json
        const pkgPath = join(process.cwd(), 'package.json');
        let pkg: { name?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
        try {
          const content = await readFile(pkgPath, 'utf-8');
          pkg = JSON.parse(content);
        } catch {
          throw new Error('package.json not found in current directory. Make sure to run inside an npm project.');
        }

        const deps = {
          ...(pkg.dependencies ?? {}),
          ...(pkg.devDependencies ?? {}),
        };

        const packageNames = Object.keys(deps);
        if (packageNames.length === 0) {
          spinner.warn('No dependencies found in package.json');
          return;
        }

        spinner.update(`Loading configuration and providers...`);
        const config = await loadConfig({
          cache: { enabled: options.cache !== false },
        });

        const cache = config.cache.enabled
          ? new CacheManager(config.cache.directory)
          : undefined;

        const npmProvider = new NpmProvider(cache);
        const entries: SnapshotEntry[] = [];

        // 2. Fetch and resolve each dependency
        for (let i = 0; i < packageNames.length; i++) {
          const name = packageNames[i]!;
          spinner.update(`Fetching metadata for ${name} (${i + 1}/${packageNames.length})...`);

          try {
            const metadata = await npmProvider.getPackageMetadata(name);
            const latest = metadata['dist-tags']['latest'] ?? '';
            const versionData = metadata.versions[latest];

            if (!versionData) continue;

            entries.push({
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

        // 3. Save snapshot
        spinner.update('Writing snapshot to file...');
        const snapshot: DependencySnapshot = {
          createdAt: new Date().toISOString(),
          name: pkg.name ?? 'anonymous-project',
          dependencies: entries,
          metadata: {
            totalDependencies: entries.length,
          },
        };

        const snapshotManager = new SnapshotManager();
        await snapshotManager.save(snapshot, options.output);

        spinner.succeed(`Dependency snapshot successfully saved to: ${options.output}`);
        logger.info(`Snapshot contains ${entries.length} trusted dependencies.`);
      } catch (error) {
        spinner.fail('Snapshot failed');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 10;
      }
    });
}
