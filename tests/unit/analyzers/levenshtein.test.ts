/**
 * Tests for Levenshtein distance and typosquatting detection.
 */

import { describe, it, expect } from 'vitest';
import {
  levenshteinDistance,
  normalizedSimilarity,
  detectTyposquatPatterns,
} from '../../../src/analyzers/typosquatting/levenshtein.js';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns length for empty vs non-empty', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
    expect(levenshteinDistance('hello', '')).toBe(5);
  });

  it('returns 0 for both empty', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('calculates single character insertions', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('calculates single character deletions', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  it('calculates single character substitutions', () => {
    expect(levenshteinDistance('cat', 'car')).toBe(1);
  });

  it('calculates multi-edit distances', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });

  it('handles npm package names', () => {
    expect(levenshteinDistance('lodash', 'l0dash')).toBe(1);
    expect(levenshteinDistance('express', 'expres')).toBe(1);
    expect(levenshteinDistance('react', 'rreact')).toBe(1);
    expect(levenshteinDistance('chalk', 'chalkk')).toBe(1);
  });
});

describe('normalizedSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(normalizedSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('returns 0.0 for completely different strings', () => {
    expect(normalizedSimilarity('abc', 'xyz')).toBe(0.0);
  });

  it('returns high similarity for similar package names', () => {
    const similarity = normalizedSimilarity('lodash', 'l0dash');
    expect(similarity).toBeGreaterThan(0.8);
  });
});

describe('detectTyposquatPatterns', () => {
  it('detects single character edits', () => {
    const matches = detectTyposquatPatterns('expres', 'express');
    expect(matches.some((m) => m.type === 'single-char-edit')).toBe(true);
  });

  it('detects separator confusion', () => {
    const matches = detectTyposquatPatterns('my_package', 'my-package');
    expect(matches.some((m) => m.type === 'separator-confusion')).toBe(true);
  });

  it('detects version-in-name', () => {
    const matches = detectTyposquatPatterns('lodash2', 'lodash');
    expect(matches.some((m) => m.type === 'version-in-name')).toBe(true);
  });

  it('returns empty for unrelated names', () => {
    const matches = detectTyposquatPatterns('totally-different', 'express');
    expect(matches).toHaveLength(0);
  });
});
