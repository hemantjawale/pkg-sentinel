/**
 * Analysis context — shared mutable context passed through the pipeline.
 * Holds all fetched data and intermediate results.
 */

import type { NpmPackageMetadata, NpmDownloads } from '../providers/npm/types.js';
import type { GitHubRepoData, GitHubContributor } from '../providers/github/types.js';
import type { ScriptAnalysisResult } from '../types/analysis.js';

/**
 * The analysis context carries all data needed by analyzers.
 * It is populated by the pipeline stages and consumed by analyzers.
 */
export class AnalysisContext {
  /** Package name being analyzed. */
  readonly packageName: string;

  /** Package version being analyzed. */
  packageVersion: string;

  /** npm registry metadata. */
  npmMetadata?: NpmPackageMetadata;

  /** npm download stats. */
  npmDownloads?: NpmDownloads;

  /** GitHub repository data. */
  githubData?: GitHubRepoData;

  /** GitHub contributors. */
  githubContributors?: GitHubContributor[];

  /** Recent GitHub commits. */
  githubCommits?: Array<{ sha: string; date: string; author: string }>;

  /** GitHub issue statistics. */
  githubIssueStats?: {
    openCount: number;
    closedCount: number;
    avgResponseTimeHours: number;
  };

  /** Install script analysis results (for exfiltration analyzer). */
  scriptAnalysisResults?: ScriptAnalysisResult[];

  /** GitHub repository URL (extracted from npm metadata). */
  repositoryUrl?: string;

  /** Timestamp when analysis started. */
  readonly startedAt: Date;

  /** Arbitrary metadata store for inter-analyzer communication. */
  private readonly store = new Map<string, unknown>();

  constructor(packageName: string, version = 'latest') {
    this.packageName = packageName;
    this.packageVersion = version;
    this.startedAt = new Date();
  }

  /** Store a value for later retrieval by key. */
  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  /** Retrieve a stored value by key. */
  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  /** Check if a key exists in the store. */
  has(key: string): boolean {
    return this.store.has(key);
  }

  /** Get the elapsed time since analysis started. */
  get elapsedMs(): number {
    return Date.now() - this.startedAt.getTime();
  }
}
