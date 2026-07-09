/**
 * Provider interfaces — abstractions over external data sources.
 * Implementations can be swapped without changing analyzers.
 */

import type { NpmPackageMetadata, NpmDownloads } from './npm/types.js';
import type { GitHubRepoData, GitHubContributor } from './github/types.js';

/** Interface for the npm registry data provider. */
export interface INpmProvider {
  /**
   * Fetch full metadata for a package.
   * Corresponds to GET https://registry.npmjs.org/{package}
   */
  getPackageMetadata(packageName: string): Promise<NpmPackageMetadata>;

  /**
   * Fetch download counts for a package.
   */
  getDownloads(packageName: string, period?: string): Promise<NpmDownloads>;

  /**
   * Fetch the tarball URL for a specific version.
   */
  getTarballUrl(packageName: string, version: string): Promise<string>;

  /**
   * Download and extract the tarball contents for a version.
   * Returns a map of file paths to contents.
   */
  getPackageFiles(
    packageName: string,
    version: string,
  ): Promise<Map<string, string>>;
}

/** Interface for the GitHub data provider. */
export interface IGitHubProvider {
  /**
   * Fetch repository data from a GitHub repo URL or owner/repo string.
   */
  getRepoData(repoUrl: string): Promise<GitHubRepoData>;

  /**
   * Fetch contributor list for a repository.
   */
  getContributors(owner: string, repo: string): Promise<GitHubContributor[]>;

  /**
   * Fetch recent commits for a repository.
   */
  getRecentCommits(
    owner: string,
    repo: string,
    since?: Date,
  ): Promise<Array<{ sha: string; date: string; author: string }>>;

  /**
   * Fetch issue statistics for a repository.
   */
  getIssueStats(
    owner: string,
    repo: string,
  ): Promise<{
    openCount: number;
    closedCount: number;
    avgResponseTimeHours: number;
  }>;

  /**
   * Check remaining rate limit.
   */
  getRateLimit(): Promise<{
    remaining: number;
    limit: number;
    resetAt: Date;
  }>;
}

/** Interface for the cache layer. */
export interface ICacheManager {
  /** Get a cached value, or undefined if not found/expired. */
  get<T>(key: string): Promise<T | undefined>;

  /** Set a value in the cache with a TTL in seconds. */
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

  /** Check if a key exists and is not expired. */
  has(key: string): Promise<boolean>;

  /** Delete a specific key. */
  delete(key: string): Promise<void>;

  /** Clear the entire cache. */
  clear(): Promise<void>;

  /** Get cache statistics. */
  stats(): Promise<{ size: number; keys: number }>;
}
