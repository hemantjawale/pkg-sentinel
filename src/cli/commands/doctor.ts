/**
 * CLI command: doctor
 * Diagnose pkg-sentinel configuration and environment.
 */

import type { Command } from 'commander';
import chalk from 'chalk';
import { Logger } from '../ui/logger.js';
import { loadConfig } from '../../config/loader.js';
import { CacheManager } from '../../providers/cache/cache-manager.js';
import { formatBytes } from '../../utils/validation.js';

export function registerDoctorCommand(program: Command): void {
  program
    .command('doctor')
    .description('Diagnose pkg-sentinel configuration and environment')
    .action(async () => {
      const logger = new Logger();
      logger.banner();
      logger.header('Environment Diagnostics');

      // Node.js version
      const nodeVersion = process.version;
      const nodeMajor = parseInt(nodeVersion.slice(1), 10);
      if (nodeMajor >= 18) {
        logger.success(`Node.js ${nodeVersion}`);
      } else {
        logger.error(`Node.js ${nodeVersion} — requires >= 18.0.0`);
      }

      // Configuration
      try {
        const config = await loadConfig();
        logger.success('Configuration loaded successfully');

        // GitHub token
        if (config.github.token) {
          logger.success('GitHub token: configured');
        } else {
          logger.warn('GitHub token: not configured (set GITHUB_TOKEN for full analysis)');
        }

        // AI provider
        if (config.ai.enabled) {
          logger.success(`AI provider: ${config.ai.provider}`);
        } else {
          logger.info('AI explanations: disabled');
        }

        // Cache
        if (config.cache.enabled) {
          const cache = new CacheManager(config.cache.directory);
          const stats = await cache.stats();
          logger.success(
            `Cache: ${stats.keys} entries, ${formatBytes(stats.size)} (${config.cache.directory})`,
          );
        } else {
          logger.info('Cache: disabled');
        }

        logger.blank();
        logger.success(chalk.green('pkg-sentinel is ready!'));
      } catch (error) {
        logger.error(`Configuration error: ${error instanceof Error ? error.message : String(error)}`);
        process.exitCode = 10;
      }
    });
}
