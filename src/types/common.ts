/**
 * Common types, enums, and constants shared across pkg-sentinel.
 */

/** Severity levels for findings — ordered from lowest to highest risk. */
export enum Severity {
  Info = 'info',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/** Numeric severity for ordering and comparison. */
export const SEVERITY_ORDER: Record<Severity, number> = {
  [Severity.Info]: 0,
  [Severity.Low]: 1,
  [Severity.Medium]: 2,
  [Severity.High]: 3,
  [Severity.Critical]: 4,
};

/** Compare two severities. Returns positive if a > b. */
export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}

/** Category of analysis being performed. */
export enum AnalysisCategory {
  Health = 'health',
  SupplyChain = 'supply-chain',
  InstallScripts = 'install-scripts',
  Typosquatting = 'typosquatting',
  Exfiltration = 'exfiltration',
  Trust = 'trust',
}

/** Status of an individual analysis run. */
export enum AnalysisStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Skipped = 'skipped',
}

/** CI-friendly exit codes. */
export enum ExitCode {
  Success = 0,
  Warnings = 1,
  HighRisk = 2,
  CriticalRisk = 3,
  ConfigError = 10,
  NetworkError = 11,
}

/** Supported report output formats. */
export enum ReportFormat {
  Terminal = 'terminal',
  Json = 'json',
  Html = 'html',
  Markdown = 'markdown',
}

/** Trust level classification derived from trust score. */
export enum TrustLevel {
  Trusted = 'trusted',
  Moderate = 'moderate',
  Low = 'low',
  Untrusted = 'untrusted',
  Unknown = 'unknown',
}

/** Map numeric trust score ranges to trust levels. */
export function trustLevelFromScore(score: number): TrustLevel {
  if (score >= 80) return TrustLevel.Trusted;
  if (score >= 60) return TrustLevel.Moderate;
  if (score >= 40) return TrustLevel.Low;
  if (score >= 0) return TrustLevel.Untrusted;
  return TrustLevel.Unknown;
}

/** Install script lifecycle hooks we inspect. */
export const INSTALL_SCRIPT_HOOKS = [
  'preinstall',
  'install',
  'postinstall',
  'prepare',
] as const;

export type InstallScriptHook = (typeof INSTALL_SCRIPT_HOOKS)[number];

/** Package identifier with optional version. */
export interface PackageSpec {
  name: string;
  version?: string;
  scope?: string;
}

/** Parse a package specifier like "@scope/name@1.2.3" */
export function parsePackageSpec(input: string): PackageSpec {
  const trimmed = input.trim();
  let name: string;
  let version: string | undefined;
  let scope: string | undefined;

  if (trimmed.startsWith('@')) {
    // Scoped package: @scope/name@version
    const withoutAt = trimmed.slice(1);
    const slashIdx = withoutAt.indexOf('/');
    if (slashIdx === -1) {
      throw new Error(`Invalid scoped package specifier: "${input}"`);
    }
    scope = '@' + withoutAt.slice(0, slashIdx);
    const rest = withoutAt.slice(slashIdx + 1);
    const atIdx = rest.lastIndexOf('@');
    if (atIdx > 0) {
      name = scope + '/' + rest.slice(0, atIdx);
      version = rest.slice(atIdx + 1);
    } else {
      name = scope + '/' + rest;
    }
  } else {
    const atIdx = trimmed.lastIndexOf('@');
    if (atIdx > 0) {
      name = trimmed.slice(0, atIdx);
      version = trimmed.slice(atIdx + 1);
    } else {
      name = trimmed;
    }
  }

  return { name, version, scope };
}
