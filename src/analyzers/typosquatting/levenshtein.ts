/**
 * Levenshtein distance implementation.
 * Used for typosquatting detection.
 */

/**
 * Calculate the Levenshtein distance between two strings.
 * O(m*n) dynamic programming implementation.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Optimize for empty strings
  if (m === 0) return n;
  if (n === 0) return m;

  // Use single-row optimization for space efficiency
  let previousRow = new Array<number>(n + 1);
  let currentRow = new Array<number>(n + 1);

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    previousRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currentRow[0] = i;

    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        (currentRow[j - 1] ?? 0) + 1,      // Insertion
        (previousRow[j] ?? 0) + 1,          // Deletion
        (previousRow[j - 1] ?? 0) + cost,   // Substitution
      );
    }

    // Swap rows
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[n] ?? 0;
}

/**
 * Calculate normalized similarity between two strings (0–1).
 * 1.0 = identical, 0.0 = completely different.
 */
export function normalizedSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Check common typosquatting patterns between two package names.
 */
export function detectTyposquatPatterns(
  suspectName: string,
  legitimateName: string,
): TyposquatMatch[] {
  const matches: TyposquatMatch[] = [];

  // Character substitution (e.g., 'lodash' vs 'l0dash')
  if (hasCharacterSubstitution(suspectName, legitimateName)) {
    matches.push({
      type: 'character-substitution',
      description: `"${suspectName}" has character substitution compared to "${legitimateName}"`,
      confidence: 85,
    });
  }

  // Hyphen/underscore confusion (e.g., 'my-package' vs 'my_package')
  if (hasSeparatorConfusion(suspectName, legitimateName)) {
    matches.push({
      type: 'separator-confusion',
      description: `"${suspectName}" differs only in separators from "${legitimateName}"`,
      confidence: 90,
    });
  }

  // Missing/extra character (e.g., 'expres' vs 'express')
  const distance = levenshteinDistance(suspectName, legitimateName);
  if (distance === 1) {
    matches.push({
      type: 'single-char-edit',
      description: `"${suspectName}" is 1 character edit away from "${legitimateName}"`,
      confidence: 92,
    });
  }

  // Scope squatting (e.g., '@scope/name' where 'name' exists unscoped)
  const unscoped = suspectName.replace(/^@[^/]+\//, '');
  if (unscoped !== suspectName && unscoped === legitimateName) {
    matches.push({
      type: 'scope-squatting',
      description: `"${suspectName}" adds a scope to legitimate package "${legitimateName}"`,
      confidence: 70,
    });
  }

  // Version in name (e.g., 'lodash2' when 'lodash' exists)
  if (/\d+$/.test(suspectName)) {
    const withoutDigits = suspectName.replace(/\d+$/, '');
    if (withoutDigits === legitimateName) {
      matches.push({
        type: 'version-in-name',
        description: `"${suspectName}" appends digits to "${legitimateName}"`,
        confidence: 75,
      });
    }
  }

  return matches;
}

/** A detected typosquatting pattern match. */
export interface TyposquatMatch {
  type: string;
  description: string;
  confidence: number;
}

/** Check for lookalike character substitutions (0/o, 1/l, etc.). */
function hasCharacterSubstitution(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  const substitutions: Record<string, string[]> = {
    '0': ['o', 'O'],
    'o': ['0'],
    'O': ['0'],
    '1': ['l', 'I', 'i'],
    'l': ['1', 'I'],
    'I': ['1', 'l'],
    'i': ['1'],
    'rn': ['m'],
    'm': ['rn'],
  };

  let differences = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      differences++;
      const subs = substitutions[a[i]!];
      if (!subs || !subs.includes(b[i]!)) {
        return false;
      }
    }
  }

  return differences > 0 && differences <= 2;
}

/** Check if names differ only in hyphen/underscore/dot usage. */
function hasSeparatorConfusion(a: string, b: string): boolean {
  const normalize = (s: string) => s.replace(/[-_.]/g, '');
  return a !== b && normalize(a) === normalize(b);
}
