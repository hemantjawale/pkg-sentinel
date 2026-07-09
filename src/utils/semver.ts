/**
 * Semver utility functions.
 */

/** Parsed semantic version. */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string[];
  raw: string;
}

/** Regex for semver parsing. */
const SEMVER_REGEX =
  /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.]+))?(?:\+([a-zA-Z0-9.]+))?$/;

/**
 * Parse a semver string into its components.
 * Returns null if the string is not a valid semver.
 */
export function parseSemver(version: string): ParsedVersion | null {
  const match = version.trim().match(SEMVER_REGEX);
  if (!match) return null;

  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
    prerelease: match[4] ? match[4].split('.') : [],
    build: match[5] ? match[5].split('.') : [],
    raw: version.trim(),
  };
}

/**
 * Compare two semver strings.
 * Returns: negative if a < b, 0 if equal, positive if a > b.
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;

  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;

  // Pre-release versions have lower precedence
  if (pa.prerelease.length > 0 && pb.prerelease.length === 0) return -1;
  if (pa.prerelease.length === 0 && pb.prerelease.length > 0) return 1;

  return 0;
}

/**
 * Sort an array of version strings in descending order (newest first).
 */
export function sortVersionsDesc(versions: string[]): string[] {
  return [...versions].sort((a, b) => compareSemver(b, a));
}

/**
 * Check if a version is a pre-release version.
 */
export function isPrerelease(version: string): boolean {
  const parsed = parseSemver(version);
  return parsed !== null && parsed.prerelease.length > 0;
}

/**
 * Get the latest stable version from an array of versions.
 */
export function getLatestStable(versions: string[]): string | undefined {
  const stable = versions.filter((v) => !isPrerelease(v));
  const sorted = sortVersionsDesc(stable);
  return sorted[0];
}

/**
 * Calculate the number of days between two version release dates.
 */
export function daysBetween(dateA: string | Date, dateB: string | Date): number {
  const a = typeof dateA === 'string' ? new Date(dateA) : dateA;
  const b = typeof dateB === 'string' ? new Date(dateB) : dateB;
  const diffMs = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
