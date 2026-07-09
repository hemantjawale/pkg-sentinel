/**
 * CLI entry point — Commander.js program setup.
 */

import { Command } from 'commander';
import { registerCheckCommand } from './commands/check.js';
import { registerAuditCommand } from './commands/audit.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerExplainCommand } from './commands/explain.js';
import { registerSnapshotCommand } from './commands/snapshot.js';
import { registerDiffCommand } from './commands/diff.js';
import { registerReportCommand } from './commands/report.js';

const program = new Command();

program
  .name('pkg-sentinel')
  .description('🛡️  npm supply-chain security — trust analysis, health scoring, and risk detection')
  .version('0.1.0');

// Register all commands
registerCheckCommand(program);
registerAuditCommand(program);
registerDoctorCommand(program);
registerExplainCommand(program);
registerSnapshotCommand(program);
registerDiffCommand(program);
registerReportCommand(program);

// Parse and execute
program.parse();
