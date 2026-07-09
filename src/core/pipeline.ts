/**
 * Analysis pipeline builder.
 * Constructs and executes the analysis pipeline stages.
 */

import type { AnalysisContext } from './context.js';
import type { INpmProvider, IGitHubProvider } from '../providers/interfaces.js';
import { parseGitHubUrl } from '../utils/validation.js';

/** A pipeline stage function. */
export type PipelineStage = (context: AnalysisContext) => Promise<void>;

/**
 * Build the data-fetching pipeline stages.
 */
export function buildFetchPipeline(
  npmProvider: INpmProvider,
  githubProvider?: IGitHubProvider,
): PipelineStage[] {
  const stages: PipelineStage[] = [];

  // Stage 1: Fetch npm metadata
  stages.push(async (ctx) => {
    ctx.npmMetadata = await npmProvider.getPackageMetadata(ctx.packageName);

    // Resolve 'latest' version
    if (ctx.packageVersion === 'latest' && ctx.npmMetadata['dist-tags']['latest']) {
      ctx.packageVersion = ctx.npmMetadata['dist-tags']['latest'];
    }

    // Extract repository URL
    const repoUrl = ctx.npmMetadata.repository?.url;
    if (repoUrl) {
      ctx.repositoryUrl = repoUrl;
    }
  });

  // Stage 2: Fetch npm downloads
  stages.push(async (ctx) => {
    try {
      ctx.npmDownloads = await npmProvider.getDownloads(ctx.packageName);
    } catch {
      // Non-fatal — downloads are optional
    }
  });

  // Stage 3: Fetch GitHub data (if available)
  if (githubProvider) {
    stages.push(async (ctx) => {
      if (!ctx.repositoryUrl) return;

      const parsed = parseGitHubUrl(ctx.repositoryUrl);
      if (!parsed) return;

      try {
        // Fetch all GitHub data in parallel
        const [repoData, contributors, commits, issueStats] = await Promise.all([
          githubProvider.getRepoData(`${parsed.owner}/${parsed.repo}`),
          githubProvider.getContributors(parsed.owner, parsed.repo),
          githubProvider.getRecentCommits(parsed.owner, parsed.repo),
          githubProvider.getIssueStats(parsed.owner, parsed.repo),
        ]);

        ctx.githubData = repoData;
        ctx.githubContributors = contributors;
        ctx.githubCommits = commits;
        ctx.githubIssueStats = issueStats;
      } catch {
        // Non-fatal — GitHub data is optional
      }
    });
  }

  return stages;
}

/**
 * Execute pipeline stages sequentially.
 */
export async function executePipeline(
  stages: PipelineStage[],
  context: AnalysisContext,
): Promise<void> {
  for (const stage of stages) {
    await stage(context);
  }
}
