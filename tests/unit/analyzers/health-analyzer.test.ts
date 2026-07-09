import { describe, it, expect } from 'vitest';
import { HealthAnalyzer } from '../../../src/analyzers/health/health-analyzer.js';
import { AnalysisContext } from '../../../src/core/context.js';
import type { NpmPackageMetadata } from '../../../src/providers/npm/types.js';
import type { GitHubRepoData } from '../../../src/providers/github/types.js';

describe('HealthAnalyzer', () => {
  it('correctly calculates metrics and scores from context', async () => {
    const analyzer = new HealthAnalyzer();
    const context = new AnalysisContext('chalk');

    // Populate mock metadata in context
    context.npmMetadata = {
      name: 'chalk',
      'dist-tags': { latest: '5.3.0' },
      versions: {},
      maintainers: [{ name: 'sindresorhus' }, { name: 'jbnicolai' }],
      time: {
        created: '2014-03-09T03:36:11.838Z',
        modified: '2024-03-09T03:36:11.838Z',
        '5.3.0': '2024-03-09T03:36:11.838Z',
        '5.2.0': '2023-03-09T03:36:11.838Z',
      },
    } as unknown as NpmPackageMetadata;

    context.githubData = {
      stargazers_count: 22000,
      pushed_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 years
      archived: false,
    } as unknown as GitHubRepoData;

    context.githubContributors = [
      { login: 'sindresorhus', contributions: 80, type: 'User', avatar_url: '' },
      { login: 'jbnicolai', contributions: 20, type: 'User', avatar_url: '' },
    ];

    context.githubCommits = [
      { sha: '1', date: new Date().toISOString(), author: 'sindresorhus' },
      { sha: '2', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), author: 'sindresorhus' },
    ];

    context.githubIssueStats = {
      openCount: 5,
      closedCount: 15,
      avgResponseTimeHours: 12,
    };

    context.npmDownloads = {
      downloads: 12000000,
      start: '',
      end: '',
      package: 'chalk',
    };

    const result = await analyzer.analyze(context);

    expect(result.analyzer).toBe('health');
    expect(result.status).toBe('completed');
    expect(result.metadata['metrics']).toBeDefined();
    expect(result.metadata['metricScores']).toBeDefined();

    const metrics = result.metadata['metrics'] as Record<string, unknown>;
    expect(metrics['githubStars']).toBe(22000);
    expect(metrics['contributorCount']).toBe(2);
    expect(metrics['maintainerCount']).toBe(2);
    expect(metrics['busFactorEstimate']).toBe(1); // 80% contributions from 1 author means bus factor is 1
  });
});
