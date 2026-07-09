import { describe, it, expect } from 'vitest';
import { GitHubProvider } from '../../../src/providers/github/github-provider.js';

describe('GitHubProvider', () => {
  it('fetches repository data successfully', async () => {
    const provider = new GitHubProvider();
    const repo = await provider.getRepoData('chalk/chalk');

    expect(repo.full_name).toBe('chalk/chalk');
    expect(repo.stargazers_count).toBe(22000);
    expect(repo.forks_count).toBe(1200);
  });

  it('fetches repository contributors successfully', async () => {
    const provider = new GitHubProvider();
    const contributors = await provider.getContributors('chalk', 'chalk');

    expect(contributors).toHaveLength(2);
    expect(contributors[0]?.login).toBe('sindresorhus');
    expect(contributors[0]?.contributions).toBe(850);
  });

  it('fetches commit details successfully', async () => {
    const provider = new GitHubProvider();
    const commits = await provider.getRecentCommits('chalk', 'chalk');

    expect(commits).toHaveLength(1);
    expect(commits[0]?.sha).toBe('abcdef123456');
    expect(commits[0]?.author).toBe('sindresorhus');
  });

  it('calculates average issue response time successfully', async () => {
    const provider = new GitHubProvider();
    const stats = await provider.getIssueStats('chalk', 'chalk');

    expect(stats.openCount).toBe(1);
    expect(stats.closedCount).toBe(1);
    expect(stats.avgResponseTimeHours).toBeCloseTo(24, 1);
  });
});
