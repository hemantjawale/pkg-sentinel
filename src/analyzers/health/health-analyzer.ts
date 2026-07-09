/**
 * Health analyzer — evaluates repository and package health.
 */

import type { IAnalyzer } from '../interfaces.js';
import type { AnalyzerResult, HealthMetrics } from '../../types/analysis.js';
import { AnalysisCategory, AnalysisStatus } from '../../types/common.js';
import type { AnalysisContext } from '../../core/context.js';
import { calculateHealthMetrics } from './metrics.js';
import { daysBetween } from '../../utils/semver.js';

export class HealthAnalyzer implements IAnalyzer {
  readonly name = 'health';
  readonly description = 'Evaluates repository health, maintainer activity, and community adoption';
  readonly category = AnalysisCategory.Health;

  canAnalyze(context: AnalysisContext): boolean {
    // Can analyze if we have npm metadata (always), but deeper analysis needs GitHub
    return context.npmMetadata !== undefined;
  }

  async analyze(context: AnalysisContext): Promise<AnalyzerResult> {
    const start = Date.now();

    try {
      const metrics = await this.collectMetrics(context);
      const metricScores = calculateHealthMetrics(metrics);

      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Completed,
        findings: [],
        durationMs: Date.now() - start,
        metadata: {
          metrics,
          metricScores,
        },
      };
    } catch (error) {
      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Failed,
        findings: [],
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
        metadata: {},
      };
    }
  }

  private async collectMetrics(context: AnalysisContext): Promise<HealthMetrics> {
    const { npmMetadata, githubData, githubContributors, githubCommits, githubIssueStats, npmDownloads } = context;

    // Calculate release frequency from npm time data
    let releaseFrequencyDays: number | null = null;
    let recentReleaseCadenceDays: number | null = null;
    if (npmMetadata?.time) {
      const versions = Object.entries(npmMetadata.time)
        .filter(([key]) => key !== 'created' && key !== 'modified')
        .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime());

      if (versions.length >= 2) {
        const newest = versions[0]!;
        const oldest = versions[versions.length - 1]!;
        const totalDays = daysBetween(oldest[1], newest[1]);
        releaseFrequencyDays = Math.round(totalDays / (versions.length - 1));

        // Recent cadence: last 5 releases
        const recent = versions.slice(0, Math.min(5, versions.length));
        if (recent.length >= 2) {
          const recentDays = daysBetween(recent[recent.length - 1]![1], recent[0]![1]);
          recentReleaseCadenceDays = Math.round(recentDays / (recent.length - 1));
        }
      }
    }

    // Calculate commit frequency
    let commitFrequencyPerWeek: number | null = null;
    if (githubCommits && githubCommits.length > 0) {
      const oldest = githubCommits[githubCommits.length - 1]!;
      const days = daysBetween(oldest.date, new Date().toISOString());
      const weeks = Math.max(days / 7, 1);
      commitFrequencyPerWeek = Math.round((githubCommits.length / weeks) * 10) / 10;
    }

    // Estimate bus factor from contributor distribution
    let busFactorEstimate: number | null = null;
    if (githubContributors && githubContributors.length > 0) {
      const totalContributions = githubContributors.reduce((sum, c) => sum + c.contributions, 0);
      let accumulated = 0;
      let busFactor = 0;
      for (const contributor of githubContributors) {
        accumulated += contributor.contributions;
        busFactor++;
        if (accumulated >= totalContributions * 0.5) break;
      }
      busFactorEstimate = busFactor;
    }

    // Calculate closed issue ratio
    let closedIssueRatio: number | null = null;
    if (githubIssueStats) {
      const total = githubIssueStats.openCount + githubIssueStats.closedCount;
      if (total > 0) {
        closedIssueRatio = githubIssueStats.closedCount / total;
      }
    }

    // Repository age
    let repositoryAgeDays: number | null = null;
    if (githubData?.created_at) {
      repositoryAgeDays = daysBetween(githubData.created_at, new Date().toISOString());
    }

    return {
      githubStars: githubData?.stargazers_count ?? null,
      contributorCount: githubContributors?.length ?? null,
      activeMaintainers: npmMetadata?.maintainers?.length ?? null,
      lastCommitDate: githubData?.pushed_at ?? null,
      releaseFrequencyDays,
      openIssueCount: githubIssueStats?.openCount ?? null,
      closedIssueRatio,
      avgIssueResponseTimeHours: githubIssueStats?.avgResponseTimeHours ?? null,
      isArchived: githubData?.archived ?? null,
      repositoryAgeDays,
      commitFrequencyPerWeek,
      maintainerCount: npmMetadata?.maintainers?.length ?? null,
      busFactorEstimate,
      weeklyDownloads: npmDownloads?.downloads ?? null,
      recentReleaseCadenceDays,
    };
  }
}
