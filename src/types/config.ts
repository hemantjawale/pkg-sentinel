/**
 * Configuration types for pkg-sentinel.
 * All configuration is typed — no dynamic keys or untyped objects.
 */

import type { ReportFormat, Severity } from './common.js';

/** Top-level configuration for pkg-sentinel. */
export interface PkgSentinelConfig {
  /** Minimum severity to report. Findings below this are suppressed. */
  minSeverity: Severity;

  /** Output format for reports. */
  reportFormat: ReportFormat;

  /** Cache configuration. */
  cache: CacheConfig;

  /** GitHub API configuration. */
  github: GitHubConfig;

  /** Scoring weight overrides. */
  scoring: ScoringConfig;

  /** AI explanation configuration. */
  ai: AIConfig;

  /** Plugin directories to load. */
  plugins: PluginConfig;

  /** Snapshot storage path. */
  snapshotDir: string;

  /** Maximum concurrent operations. */
  concurrency: number;

  /** Packages to ignore during audit. */
  ignoredPackages: string[];

  /** Rules to disable by ID. */
  disabledRules: string[];
}

/** Cache storage and TTL configuration. */
export interface CacheConfig {
  /** Whether caching is enabled. */
  enabled: boolean;

  /** Cache directory path. */
  directory: string;

  /** TTL for npm registry data in seconds. */
  npmTtlSeconds: number;

  /** TTL for GitHub API data in seconds. */
  githubTtlSeconds: number;

  /** Maximum cache size in MB. */
  maxSizeMb: number;
}

/** GitHub API access configuration. */
export interface GitHubConfig {
  /** Personal access token. Read from GITHUB_TOKEN env var if not set. */
  token?: string;

  /** GitHub API base URL (for enterprise). */
  apiBaseUrl: string;

  /** Maximum requests per hour (respects rate limits). */
  maxRequestsPerHour: number;
}

/** Scoring engine weight overrides. */
export interface ScoringConfig {
  /** Weight overrides by category name. Values 0–100. */
  weights: Record<string, number>;
}

/** AI explanation provider configuration. */
export interface AIConfig {
  /** Whether AI explanations are enabled. */
  enabled: boolean;

  /** AI provider to use. */
  provider: 'openai' | 'anthropic' | 'none';

  /** API key. Read from env vars if not set. */
  apiKey?: string;

  /** Model name to use. */
  model?: string;

  /** Maximum tokens for the response. */
  maxTokens: number;
}

/** Plugin loading configuration. */
export interface PluginConfig {
  /** Directories to search for plugins. */
  directories: string[];

  /** Specific plugin packages to load. */
  packages: string[];

  /** Plugins to disable by name. */
  disabled: string[];
}

/** Deep partial utility type for config overrides. */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
