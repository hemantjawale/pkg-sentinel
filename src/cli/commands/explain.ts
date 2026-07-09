/**
 * CLI command: explain
 * Generate AI-powered explanation of analysis results.
 */

import type { Command } from 'commander';
import { Logger } from '../ui/logger.js';

export function registerExplainCommand(program: Command): void {
  program
    .command('explain <package>')
    .description('Generate AI-powered explanation of package risks')
    .option('--provider <provider>', 'AI provider (openai, anthropic)', 'openai')
    .option('--model <model>', 'AI model to use')
    .action(async (packageArg: string, options: {
      provider: string;
      model?: string;
    }) => {
      const logger = new Logger();
      logger.banner();

      logger.info(`Generating AI explanation for ${packageArg}...`);
      logger.info(`Provider: ${options.provider}`);
      logger.blank();
      logger.info('AI explanation requires running "check" first and configuring an AI provider.');
      logger.info('Set PKG_SENTINEL_AI_KEY environment variable to enable.');
      logger.info('Full AI explanation will be available in Milestone 5.');
    });
}
