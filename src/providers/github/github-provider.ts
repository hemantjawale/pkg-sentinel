/**
 * GitHub API data provider.
 * Handles rate limiting, authentication, and response caching.
 */

import type { IGitHubProvider, ICacheManager } from '../interfaces.js';
import type {
  GitHubRepoData,
  GitHubContributor,
  GitHubCommit,
  GitHubIssue,
} from './types.js';
import { httpRequest } from '../../utils/http.js';
import { parseGitHubUrl } from '../../utils/validation.js';

const GITHUB_API = 'https://api.github.com';

export class GitHubProvider implements IGitHubProvider {
  private readonly token: string | undefined;
  private readonly apiBaseUrl: string;

  constructor(
    options: { token?: string; apiBaseUrl?: string } = {},
    private readonly cache?: ICacheManager,
  ) {
    this.token = options.token ?? process.env['GITHUB_TOKEN'];
    this.apiBaseUrl = options.apiBaseUrl ?? GITHUB_API;
  }

  async getRepoData(repoUrl: string): Promise<GitHubRepoData> {
    const { owner, repo } = this.parseRepoIdentifier(repoUrl);
    const cacheKey = `github:repo:${owner}/${repo}`;

    if (this.cache) {
      const cached = await this.cache.get<GitHubRepoData>(cacheKey);
      if (cached) return cached;
    }

    const response = await httpRequest<GitHubRepoData>(
      `${this.apiBaseUrl}/repos/${owner}/${repo}`,
      { headers: this.getHeaders() },
    );

    if (!response.ok) {
      throw new GitHubApiError(
        `GitHub API returned ${response.status} for ${owner}/${repo}`,
        response.status,
      );
    }

    if (this.cache) {
      await this.cache.set(cacheKey, response.data, 3600); // 1 hour
    }

    return response.data;
  }

  async getContributors(
    owner: string,
    repo: string,
  ): Promise<GitHubContributor[]> {
    const cacheKey = `github:contributors:${owner}/${repo}`;

    if (this.cache) {
      const cached = await this.cache.get<GitHubContributor[]>(cacheKey);
      if (cached) return cached;
    }

    const response = await httpRequest<GitHubContributor[]>(
      `${this.apiBaseUrl}/repos/${owner}/${repo}/contributors?per_page=100`,
      { headers: this.getHeaders() },
    );

    if (!response.ok) {
      return [];
    }

    if (this.cache) {
      await this.cache.set(cacheKey, response.data, 3600);
    }

    return response.data;
  }

  async getRecentCommits(
    owner: string,
    repo: string,
    since?: Date,
  ): Promise<Array<{ sha: string; date: string; author: string }>> {
    const sinceDate = since ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
    const cacheKey = `github:commits:${owner}/${repo}:${sinceDate.toISOString().split('T')[0]}`;

    if (this.cache) {
      const cached = await this.cache.get<
        Array<{ sha: string; date: string; author: string }>
      >(cacheKey);
      if (cached) return cached;
    }

    const response = await httpRequest<GitHubCommit[]>(
      `${this.apiBaseUrl}/repos/${owner}/${repo}/commits?since=${sinceDate.toISOString()}&per_page=100`,
      { headers: this.getHeaders() },
    );

    if (!response.ok) {
      return [];
    }

    const commits = response.data.map((c) => ({
      sha: c.sha,
      date: c.commit.author.date,
      author: c.author?.login ?? c.commit.author.name,
    }));

    if (this.cache) {
      await this.cache.set(cacheKey, commits, 3600);
    }

    return commits;
  }

  async getIssueStats(
    owner: string,
    repo: string,
  ): Promise<{
    openCount: number;
    closedCount: number;
    avgResponseTimeHours: number;
  }> {
    const cacheKey = `github:issues:${owner}/${repo}`;

    if (this.cache) {
      const cached = await this.cache.get<{
        openCount: number;
        closedCount: number;
        avgResponseTimeHours: number;
      }>(cacheKey);
      if (cached) return cached;
    }

    // Fetch open issues (excluding PRs)
    const openResponse = await httpRequest<GitHubIssue[]>(
      `${this.apiBaseUrl}/repos/${owner}/${repo}/issues?state=open&per_page=100`,
      { headers: this.getHeaders() },
    );

    // Fetch recently closed issues
    const closedResponse = await httpRequest<GitHubIssue[]>(
      `${this.apiBaseUrl}/repos/${owner}/${repo}/issues?state=closed&per_page=100&sort=updated&direction=desc`,
      { headers: this.getHeaders() },
    );

    const openIssues = (openResponse.ok ? openResponse.data : []).filter(
      (i) => !i.pull_request,
    );
    const closedIssues = (closedResponse.ok ? closedResponse.data : []).filter(
      (i) => !i.pull_request,
    );

    // Calculate average response time from closed issues
    let totalResponseHours = 0;
    let issuesWithResponse = 0;

    for (const issue of closedIssues) {
      if (issue.closed_at) {
        const created = new Date(issue.created_at).getTime();
        const closed = new Date(issue.closed_at).getTime();
        const hours = (closed - created) / (1000 * 60 * 60);
        totalResponseHours += hours;
        issuesWithResponse++;
      }
    }

    const result = {
      openCount: openIssues.length,
      closedCount: closedIssues.length,
      avgResponseTimeHours:
        issuesWithResponse > 0
          ? totalResponseHours / issuesWithResponse
          : 0,
    };

    if (this.cache) {
      await this.cache.set(cacheKey, result, 3600);
    }

    return result;
  }

  async getRateLimit(): Promise<{
    remaining: number;
    limit: number;
    resetAt: Date;
  }> {
    const response = await httpRequest<{
      rate: { limit: number; remaining: number; reset: number };
    }>(`${this.apiBaseUrl}/rate_limit`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return { remaining: 0, limit: 0, resetAt: new Date() };
    }

    return {
      remaining: response.data.rate.remaining,
      limit: response.data.rate.limit,
      resetAt: new Date(response.data.rate.reset * 1000),
    };
  }

  /** Build authentication headers. */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'pkg-sentinel',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /** Parse a repo identifier from a URL or "owner/repo" string. */
  private parseRepoIdentifier(input: string): {
    owner: string;
    repo: string;
  } {
    // Try "owner/repo" format first
    const slashParts = input.split('/');
    if (
      slashParts.length === 2 &&
      slashParts[0] &&
      slashParts[1] &&
      !input.includes('://')
    ) {
      return { owner: slashParts[0], repo: slashParts[1] };
    }

    // Try URL parsing
    const parsed = parseGitHubUrl(input);
    if (parsed) return parsed;

    throw new Error(`Cannot parse GitHub repository from: "${input}"`);
  }
}

/** GitHub API-specific error. */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}
