/**
 * Health metric calculators.
 * Each function normalizes a raw metric value to a 0–100 score.
 */

import type { HealthMetrics } from '../../types/analysis.js';
import type { MetricScore } from '../../types/scores.js';

/**
 * Calculate all health metric scores from raw metrics.
 */
export function calculateHealthMetrics(metrics: HealthMetrics): MetricScore[] {
  const scores: MetricScore[] = [];

  scores.push(scoreGitHubStars(metrics.githubStars));
  scores.push(scoreContributorCount(metrics.contributorCount));
  scores.push(scoreLastCommit(metrics.lastCommitDate));
  scores.push(scoreReleaseFrequency(metrics.releaseFrequencyDays));
  scores.push(scoreOpenIssueRatio(metrics.openIssueCount, metrics.closedIssueRatio));
  scores.push(scoreIssueResponseTime(metrics.avgIssueResponseTimeHours));
  scores.push(scoreArchivedStatus(metrics.isArchived));
  scores.push(scoreRepositoryAge(metrics.repositoryAgeDays));
  scores.push(scoreCommitFrequency(metrics.commitFrequencyPerWeek));
  scores.push(scoreBusFactor(metrics.busFactorEstimate));
  scores.push(scoreWeeklyDownloads(metrics.weeklyDownloads));
  scores.push(scoreMaintainerCount(metrics.maintainerCount));

  return scores;
}

function scoreGitHubStars(stars: number | null): MetricScore {
  let normalizedScore = 0;
  if (stars !== null) {
    if (stars >= 10000) normalizedScore = 100;
    else if (stars >= 5000) normalizedScore = 90;
    else if (stars >= 1000) normalizedScore = 80;
    else if (stars >= 500) normalizedScore = 70;
    else if (stars >= 100) normalizedScore = 60;
    else if (stars >= 50) normalizedScore = 50;
    else if (stars >= 10) normalizedScore = 35;
    else normalizedScore = 20;
  }

  return {
    id: 'github-stars',
    label: 'GitHub Stars',
    rawValue: stars,
    normalizedScore,
    weight: 8,
    explanation: stars !== null
      ? `Repository has ${stars.toLocaleString()} stars`
      : 'No GitHub repository linked',
  };
}

function scoreContributorCount(count: number | null): MetricScore {
  let normalizedScore = 0;
  if (count !== null) {
    if (count >= 100) normalizedScore = 100;
    else if (count >= 50) normalizedScore = 90;
    else if (count >= 20) normalizedScore = 80;
    else if (count >= 10) normalizedScore = 70;
    else if (count >= 5) normalizedScore = 55;
    else if (count >= 2) normalizedScore = 40;
    else normalizedScore = 25;
  }

  return {
    id: 'contributor-count',
    label: 'Contributor Count',
    rawValue: count,
    normalizedScore,
    weight: 10,
    explanation: count !== null
      ? `${count} contributor${count !== 1 ? 's' : ''} found`
      : 'Contributor data unavailable',
  };
}

function scoreLastCommit(lastCommitDate: string | null): MetricScore {
  let normalizedScore = 0;
  let explanation = 'No commit data available';

  if (lastCommitDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSince <= 7) normalizedScore = 100;
    else if (daysSince <= 30) normalizedScore = 90;
    else if (daysSince <= 90) normalizedScore = 75;
    else if (daysSince <= 180) normalizedScore = 55;
    else if (daysSince <= 365) normalizedScore = 35;
    else normalizedScore = 15;

    explanation = `Last commit was ${daysSince} day${daysSince !== 1 ? 's' : ''} ago`;
  }

  return {
    id: 'last-commit',
    label: 'Last Commit Recency',
    rawValue: lastCommitDate,
    normalizedScore,
    weight: 15,
    explanation,
  };
}

function scoreReleaseFrequency(days: number | null): MetricScore {
  let normalizedScore = 0;
  let explanation = 'No release frequency data available';

  if (days !== null) {
    if (days <= 7) normalizedScore = 100;
    else if (days <= 30) normalizedScore = 85;
    else if (days <= 90) normalizedScore = 70;
    else if (days <= 180) normalizedScore = 50;
    else if (days <= 365) normalizedScore = 30;
    else normalizedScore = 15;

    explanation = `Average release frequency: every ${days} day${days !== 1 ? 's' : ''}`;
  }

  return {
    id: 'release-frequency',
    label: 'Release Frequency',
    rawValue: days,
    normalizedScore,
    weight: 10,
    explanation,
  };
}

function scoreOpenIssueRatio(
  openCount: number | null,
  closedRatio: number | null,
): MetricScore {
  let normalizedScore = 50;
  let explanation = 'Issue data unavailable';

  if (closedRatio !== null) {
    // closedRatio is between 0 and 1 (proportion closed)
    normalizedScore = Math.round(closedRatio * 100);
    explanation = `${Math.round(closedRatio * 100)}% of issues have been closed`;
    if (openCount !== null) {
      explanation += ` (${openCount} open)`;
    }
  }

  return {
    id: 'issue-ratio',
    label: 'Issue Close Ratio',
    rawValue: { openCount, closedRatio },
    normalizedScore,
    weight: 8,
    explanation,
  };
}

function scoreIssueResponseTime(hours: number | null): MetricScore {
  let normalizedScore = 0;
  let explanation = 'Response time data unavailable';

  if (hours !== null) {
    if (hours <= 24) normalizedScore = 100;
    else if (hours <= 72) normalizedScore = 85;
    else if (hours <= 168) normalizedScore = 70;
    else if (hours <= 720) normalizedScore = 50;
    else normalizedScore = 25;

    const displayHours = Math.round(hours);
    explanation = displayHours <= 48
      ? `Average issue response: ${displayHours} hour${displayHours !== 1 ? 's' : ''}`
      : `Average issue response: ${Math.round(hours / 24)} days`;
  }

  return {
    id: 'issue-response-time',
    label: 'Issue Response Time',
    rawValue: hours,
    normalizedScore,
    weight: 7,
    explanation,
  };
}

function scoreArchivedStatus(isArchived: boolean | null): MetricScore {
  const normalizedScore = isArchived === true ? 0 : isArchived === false ? 100 : 50;

  return {
    id: 'archived-status',
    label: 'Archived Status',
    rawValue: isArchived,
    normalizedScore,
    weight: 12,
    explanation: isArchived === true
      ? '⚠ Repository is archived — no further maintenance expected'
      : isArchived === false
        ? 'Repository is active (not archived)'
        : 'Archive status unknown',
  };
}

function scoreRepositoryAge(days: number | null): MetricScore {
  let normalizedScore = 0;
  let explanation = 'Repository age unknown';

  if (days !== null) {
    if (days >= 1825) normalizedScore = 100;  // 5+ years
    else if (days >= 1095) normalizedScore = 90;  // 3+ years
    else if (days >= 730) normalizedScore = 80;   // 2+ years
    else if (days >= 365) normalizedScore = 65;   // 1+ year
    else if (days >= 180) normalizedScore = 50;   // 6+ months
    else if (days >= 90) normalizedScore = 35;    // 3+ months
    else normalizedScore = 20;

    const years = (days / 365).toFixed(1);
    explanation = `Repository is ${years} years old`;
  }

  return {
    id: 'repository-age',
    label: 'Repository Age',
    rawValue: days,
    normalizedScore,
    weight: 8,
    explanation,
  };
}

function scoreCommitFrequency(perWeek: number | null): MetricScore {
  let normalizedScore = 0;
  let explanation = 'Commit frequency data unavailable';

  if (perWeek !== null) {
    if (perWeek >= 10) normalizedScore = 100;
    else if (perWeek >= 5) normalizedScore = 85;
    else if (perWeek >= 2) normalizedScore = 70;
    else if (perWeek >= 1) normalizedScore = 55;
    else if (perWeek >= 0.25) normalizedScore = 35;
    else normalizedScore = 15;

    explanation = `${perWeek.toFixed(1)} commits per week`;
  }

  return {
    id: 'commit-frequency',
    label: 'Commit Frequency',
    rawValue: perWeek,
    normalizedScore,
    weight: 10,
    explanation,
  };
}

function scoreBusFactor(estimate: number | null): MetricScore {
  let normalizedScore = 0;
  let explanation = 'Bus factor unknown';

  if (estimate !== null) {
    if (estimate >= 5) normalizedScore = 100;
    else if (estimate >= 3) normalizedScore = 80;
    else if (estimate >= 2) normalizedScore = 60;
    else normalizedScore = 30;

    explanation = `Estimated bus factor: ${estimate}`;
  }

  return {
    id: 'bus-factor',
    label: 'Bus Factor',
    rawValue: estimate,
    normalizedScore,
    weight: 7,
    explanation,
  };
}

function scoreWeeklyDownloads(downloads: number | null): MetricScore {
  let normalizedScore = 0;

  if (downloads !== null) {
    if (downloads >= 1_000_000) normalizedScore = 100;
    else if (downloads >= 500_000) normalizedScore = 90;
    else if (downloads >= 100_000) normalizedScore = 80;
    else if (downloads >= 10_000) normalizedScore = 70;
    else if (downloads >= 1_000) normalizedScore = 55;
    else if (downloads >= 100) normalizedScore = 35;
    else normalizedScore = 15;
  }

  return {
    id: 'weekly-downloads',
    label: 'Weekly Downloads',
    rawValue: downloads,
    normalizedScore,
    weight: 5,
    explanation: downloads !== null
      ? `${downloads.toLocaleString()} weekly downloads`
      : 'Download data unavailable',
  };
}

function scoreMaintainerCount(count: number | null): MetricScore {
  let normalizedScore = 0;
  if (count !== null) {
    if (count >= 5) normalizedScore = 90;
    else if (count >= 3) normalizedScore = 80;
    else if (count >= 2) normalizedScore = 65;
    else normalizedScore = 40;
  }

  return {
    id: 'maintainer-count',
    label: 'Maintainer Count',
    rawValue: count,
    normalizedScore,
    weight: 10,
    explanation: count !== null
      ? `${count} npm maintainer${count !== 1 ? 's' : ''}`
      : 'Maintainer count unknown',
  };
}
