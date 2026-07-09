/**
 * Tests for utility modules.
 */

import { describe, it, expect } from 'vitest';
import { parsePackageSpec, Severity, trustLevelFromScore, compareSeverity } from '../../../src/types/common.js';
import { parseSemver, compareSemver, sortVersionsDesc, isPrerelease } from '../../../src/utils/semver.js';
import {
  isValidPackageName,
  isValidVersion,
  parseGitHubUrl,
  formatBytes,
  formatDuration,
  relativeTime,
  truncate,
} from '../../../src/utils/validation.js';
import { sha256, verifyIntegrity } from '../../../src/utils/hash.js';

describe('parsePackageSpec', () => {
  it('parses simple package name', () => {
    const spec = parsePackageSpec('lodash');
    expect(spec.name).toBe('lodash');
    expect(spec.version).toBeUndefined();
  });

  it('parses package with version', () => {
    const spec = parsePackageSpec('lodash@4.17.21');
    expect(spec.name).toBe('lodash');
    expect(spec.version).toBe('4.17.21');
  });

  it('parses scoped package', () => {
    const spec = parsePackageSpec('@babel/core');
    expect(spec.name).toBe('@babel/core');
    expect(spec.scope).toBe('@babel');
  });

  it('parses scoped package with version', () => {
    const spec = parsePackageSpec('@babel/core@7.24.0');
    expect(spec.name).toBe('@babel/core');
    expect(spec.version).toBe('7.24.0');
    expect(spec.scope).toBe('@babel');
  });
});

describe('trustLevelFromScore', () => {
  it('returns Trusted for scores >= 80', () => {
    expect(trustLevelFromScore(80)).toBe('trusted');
    expect(trustLevelFromScore(100)).toBe('trusted');
  });

  it('returns Moderate for scores 60-79', () => {
    expect(trustLevelFromScore(60)).toBe('moderate');
    expect(trustLevelFromScore(79)).toBe('moderate');
  });

  it('returns Low for scores 40-59', () => {
    expect(trustLevelFromScore(40)).toBe('low');
  });

  it('returns Untrusted for scores 0-39', () => {
    expect(trustLevelFromScore(0)).toBe('untrusted');
    expect(trustLevelFromScore(39)).toBe('untrusted');
  });
});

describe('compareSeverity', () => {
  it('correctly orders severities', () => {
    expect(compareSeverity(Severity.Critical, Severity.Info)).toBeGreaterThan(0);
    expect(compareSeverity(Severity.Info, Severity.Critical)).toBeLessThan(0);
    expect(compareSeverity(Severity.High, Severity.High)).toBe(0);
  });
});

describe('parseSemver', () => {
  it('parses standard versions', () => {
    const v = parseSemver('1.2.3');
    expect(v?.major).toBe(1);
    expect(v?.minor).toBe(2);
    expect(v?.patch).toBe(3);
  });

  it('parses prerelease versions', () => {
    const v = parseSemver('1.0.0-beta.1');
    expect(v?.prerelease).toEqual(['beta', '1']);
  });

  it('returns null for invalid versions', () => {
    expect(parseSemver('invalid')).toBeNull();
  });
});

describe('compareSemver', () => {
  it('correctly compares versions', () => {
    expect(compareSemver('2.0.0', '1.0.0')).toBeGreaterThan(0);
    expect(compareSemver('1.0.0', '2.0.0')).toBeLessThan(0);
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
  });
});

describe('sortVersionsDesc', () => {
  it('sorts versions newest first', () => {
    const sorted = sortVersionsDesc(['1.0.0', '3.0.0', '2.0.0']);
    expect(sorted).toEqual(['3.0.0', '2.0.0', '1.0.0']);
  });
});

describe('isPrerelease', () => {
  it('detects pre-release versions', () => {
    expect(isPrerelease('1.0.0-beta.1')).toBe(true);
    expect(isPrerelease('1.0.0')).toBe(false);
  });
});

describe('isValidPackageName', () => {
  it('validates correct names', () => {
    expect(isValidPackageName('lodash')).toBe(true);
    expect(isValidPackageName('@babel/core')).toBe(true);
  });

  it('rejects invalid names', () => {
    expect(isValidPackageName('')).toBe(false);
    expect(isValidPackageName('A')).toBe(false); // must start with lowercase
  });
});

describe('isValidVersion', () => {
  it('validates correct versions', () => {
    expect(isValidVersion('1.0.0')).toBe(true);
    expect(isValidVersion('1.0.0-beta.1')).toBe(true);
  });

  it('rejects invalid versions', () => {
    expect(isValidVersion('invalid')).toBe(false);
  });
});

describe('parseGitHubUrl', () => {
  it('parses HTTPS URLs', () => {
    const result = parseGitHubUrl('https://github.com/owner/repo');
    expect(result?.owner).toBe('owner');
    expect(result?.repo).toBe('repo');
  });

  it('parses git+https URLs', () => {
    const result = parseGitHubUrl('git+https://github.com/owner/repo.git');
    expect(result?.owner).toBe('owner');
    expect(result?.repo).toBe('repo');
  });

  it('returns null for non-GitHub URLs', () => {
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
  });
});

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(90000)).toBe('1m 30s');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  it('returns short strings unchanged', () => {
    expect(truncate('hi', 10)).toBe('hi');
  });
});

describe('sha256', () => {
  it('produces consistent hashes', () => {
    const hash1 = sha256('hello');
    const hash2 = sha256('hello');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', () => {
    expect(sha256('hello')).not.toBe(sha256('world'));
  });
});
