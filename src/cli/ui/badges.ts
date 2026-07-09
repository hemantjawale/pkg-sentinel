/**
 * Risk badge renderer for trust scores.
 */

import chalk from 'chalk';
import { TrustLevel } from '../../types/common.js';

/**
 * Render a large trust score badge.
 */
export function renderTrustBadge(score: number, level: string): string {
  const emoji = LEVEL_EMOJIS[level as TrustLevel] ?? '❓';
  const color = LEVEL_COLORS[level as TrustLevel] ?? chalk.gray;
  const label = LEVEL_LABELS[level as TrustLevel] ?? 'Unknown';

  const lines = [
    '',
    color(`  ╭─────────────────────────────╮`),
    color(`  │                             │`),
    color(`  │    ${emoji}  Trust Score: ${String(score).padStart(3)}     │`),
    color(`  │    Status: ${label.padEnd(16)} │`),
    color(`  │                             │`),
    color(`  ╰─────────────────────────────╯`),
    '',
  ];

  return lines.join('\n');
}

/**
 * Render a compact inline badge.
 */
export function renderInlineBadge(score: number, level: string): string {
  const emoji = LEVEL_EMOJIS[level as TrustLevel] ?? '❓';
  const color = LEVEL_COLORS[level as TrustLevel] ?? chalk.gray;
  return color(`${emoji} ${score}/100 (${level})`);
}

const LEVEL_EMOJIS: Record<TrustLevel, string> = {
  [TrustLevel.Trusted]: '🟢',
  [TrustLevel.Moderate]: '🟡',
  [TrustLevel.Low]: '🟠',
  [TrustLevel.Untrusted]: '🔴',
  [TrustLevel.Unknown]: '⚪',
};

const LEVEL_COLORS: Record<TrustLevel, typeof chalk> = {
  [TrustLevel.Trusted]: chalk.green,
  [TrustLevel.Moderate]: chalk.yellow,
  [TrustLevel.Low]: chalk.hex('#FF8800'),
  [TrustLevel.Untrusted]: chalk.red,
  [TrustLevel.Unknown]: chalk.gray,
};

const LEVEL_LABELS: Record<TrustLevel, string> = {
  [TrustLevel.Trusted]: 'Trusted',
  [TrustLevel.Moderate]: 'Moderate',
  [TrustLevel.Low]: 'Low Trust',
  [TrustLevel.Untrusted]: 'Untrusted',
  [TrustLevel.Unknown]: 'Unknown',
};
