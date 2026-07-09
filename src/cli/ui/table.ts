/**
 * Table formatter using cli-table3.
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import type { Finding } from '../../types/analysis.js';
import type { CategoryScore } from '../../types/scores.js';
import { Severity } from '../../types/common.js';

/**
 * Render findings as a formatted table.
 */
export function renderFindingsTable(findings: Finding[]): string {
  if (findings.length === 0) return chalk.green('  No findings detected.\n');

  const table = new Table({
    head: [
      chalk.gray('Severity'),
      chalk.gray('Rule'),
      chalk.gray('Title'),
      chalk.gray('Confidence'),
    ],
    colWidths: [12, 30, 40, 12],
    wordWrap: true,
    style: { head: [], border: ['gray'] },
  });

  for (const finding of findings) {
    table.push([
      severityBadge(finding.severity),
      chalk.gray(finding.ruleId),
      finding.title,
      `${finding.confidence}%`,
    ]);
  }

  return table.toString() + '\n';
}

/**
 * Render category scores as a table.
 */
export function renderScoreTable(categories: CategoryScore[]): string {
  const table = new Table({
    head: [
      chalk.gray('Category'),
      chalk.gray('Score'),
      chalk.gray('Weight'),
      chalk.gray('Bar'),
    ],
    colWidths: [25, 8, 8, 35],
    style: { head: [], border: ['gray'] },
  });

  for (const cat of categories) {
    table.push([
      cat.label,
      scoreColor(cat.score),
      `${cat.weight}%`,
      progressBar(cat.score, 30),
    ]);
  }

  return table.toString() + '\n';
}

/** Color a score value. */
function scoreColor(score: number): string {
  if (score >= 80) return chalk.green(String(score));
  if (score >= 60) return chalk.yellow(String(score));
  if (score >= 40) return chalk.hex('#FF8800')(String(score));
  return chalk.red(String(score));
}

/** Render a visual progress bar. */
function progressBar(value: number, width: number): string {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  let color: typeof chalk;
  if (value >= 80) color = chalk.green;
  else if (value >= 60) color = chalk.yellow;
  else if (value >= 40) color = chalk.hex('#FF8800');
  else color = chalk.red;

  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/** Render a severity badge. */
function severityBadge(severity: Severity): string {
  switch (severity) {
    case Severity.Critical:
      return chalk.bgRed.white(' CRIT ');
    case Severity.High:
      return chalk.red('HIGH');
    case Severity.Medium:
      return chalk.yellow('MED');
    case Severity.Low:
      return chalk.cyan('LOW');
    case Severity.Info:
      return chalk.blue('INFO');
  }
}
