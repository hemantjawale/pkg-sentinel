/**
 * Input validation utilities.
 */

/** Validate that a package name follows npm naming rules. */
export function isValidPackageName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 214) return false;

  // Scoped packages
  if (name.startsWith('@')) {
    const scopedRegex = /^@[a-z0-9][\w.-]*\/[a-z0-9][\w.-]*$/;
    return scopedRegex.test(name);
  }

  // Unscoped packages
  const unscopedRegex = /^[a-z0-9][\w.-]*$/;
  return unscopedRegex.test(name);
}

/** Validate a semver-like version string. */
export function isValidVersion(version: string): boolean {
  const semverRegex = /^v?\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
  return semverRegex.test(version);
}

/** Validate a URL string. */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Validate a GitHub repository URL and extract owner/repo. */
export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    // https://github.com/owner/repo
    /github\.com\/([^/]+)\/([^/\s#?.]+)/,
    // git+https://github.com/owner/repo.git
    /github\.com[:\/]([^/]+)\/([^/\s#?.]+?)(?:\.git)?$/,
    // git://github.com/owner/repo.git
    /github\.com\/([^/]+)\/([^/\s#?.]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[2]) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }

  return null;
}

/** Sanitize a string for safe terminal output. */
export function sanitizeForTerminal(input: string): string {
  // Remove ANSI escape sequences and control characters
  return input.replace(
    // eslint-disable-next-line no-control-regex
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]|\x1B\[[0-9;]*[A-Za-z]/g,
    '',
  );
}

/** Truncate a string to a maximum length. */
export function truncate(str: string, maxLength: number, suffix = '…'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/** Format a number with locale-aware separators. */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/** Format bytes into human-readable size. */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/** Format a duration in milliseconds to human-readable string. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/** Calculate relative time (e.g., "3 days ago"). */
export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'just now';
}
