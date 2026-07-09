/**
 * Logger — colorized terminal output with severity-based formatting.
 */

import chalk from 'chalk';
import { Severity } from '../../types/common.js';

export class Logger {
  private readonly quiet: boolean;

  constructor(options: { quiet?: boolean } = {}) {
    this.quiet = options.quiet ?? false;
  }

  info(message: string): void {
    if (!this.quiet) {
      process.stdout.write(chalk.blue('ℹ') + ' ' + message + '\n');
    }
  }

  success(message: string): void {
    if (!this.quiet) {
      process.stdout.write(chalk.green('✔') + ' ' + message + '\n');
    }
  }

  warn(message: string): void {
    process.stdout.write(chalk.yellow('⚠') + ' ' + chalk.yellow(message) + '\n');
  }

  error(message: string): void {
    process.stderr.write(chalk.red('✖') + ' ' + chalk.red(message) + '\n');
  }

  debug(message: string): void {
    if (!this.quiet) {
      process.stdout.write(chalk.gray('  ' + message) + '\n');
    }
  }

  severity(level: Severity, message: string): void {
    const prefix = SEVERITY_STYLES[level];
    process.stdout.write(prefix + ' ' + message + '\n');
  }

  blank(): void {
    if (!this.quiet) {
      process.stdout.write('\n');
    }
  }

  header(title: string): void {
    if (!this.quiet) {
      process.stdout.write('\n' + chalk.bold.white(title) + '\n');
      process.stdout.write(chalk.gray('─'.repeat(Math.min(title.length + 4, 60))) + '\n');
    }
  }

  banner(): void {
    if (!this.quiet) {
      process.stdout.write('\n');
      process.stdout.write(chalk.bold.cyan('  🛡️  pkg-sentinel') + chalk.gray(' — npm supply-chain security\n'));
      process.stdout.write(chalk.gray('  ─────────────────────────────────────\n'));
      process.stdout.write('\n');
    }
  }
}

const SEVERITY_STYLES: Record<Severity, string> = {
  [Severity.Info]: chalk.blue('ℹ INFO    '),
  [Severity.Low]: chalk.cyan('▪ LOW     '),
  [Severity.Medium]: chalk.yellow('▪ MEDIUM  '),
  [Severity.High]: chalk.red('▪ HIGH    '),
  [Severity.Critical]: chalk.bgRed.white(' CRITICAL '),
};

/** Singleton logger for convenience. */
export const logger = new Logger();
