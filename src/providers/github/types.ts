/**
 * Type definitions for GitHub API responses.
 */

/** GitHub repository data. */
export interface GitHubRepoData {
  /** Repository full name (owner/repo). */
  full_name: string;

  /** Repository description. */
  description: string | null;

  /** Star count. */
  stargazers_count: number;

  /** Fork count. */
  forks_count: number;

  /** Open issue count (includes PRs). */
  open_issues_count: number;

  /** Subscriber (watcher) count. */
  subscribers_count: number;

  /** Primary language. */
  language: string | null;

  /** Whether the repo is archived. */
  archived: boolean;

  /** Whether the repo is disabled. */
  disabled: boolean;

  /** Whether the repo is a fork. */
  fork: boolean;

  /** Default branch name. */
  default_branch: string;

  /** Creation date. */
  created_at: string;

  /** Last update date. */
  updated_at: string;

  /** Last push date. */
  pushed_at: string;

  /** Size in KB. */
  size: number;

  /** License info. */
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;

  /** Repository owner. */
  owner: {
    login: string;
    type: string;
  };

  /** HTML URL. */
  html_url: string;

  /** Topics. */
  topics: string[];

  /** Has issues enabled. */
  has_issues: boolean;

  /** Has wiki enabled. */
  has_wiki: boolean;
}

/** GitHub contributor data. */
export interface GitHubContributor {
  /** GitHub username. */
  login: string;

  /** Number of contributions. */
  contributions: number;

  /** User type (User, Bot, etc.). */
  type: string;

  /** Avatar URL. */
  avatar_url: string;
}

/** GitHub commit data (simplified). */
export interface GitHubCommit {
  /** Commit SHA. */
  sha: string;

  /** Commit info. */
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };

  /** Author GitHub user info. */
  author: {
    login: string;
  } | null;
}

/** GitHub issue data (simplified). */
export interface GitHubIssue {
  /** Issue number. */
  number: number;

  /** Issue state. */
  state: 'open' | 'closed';

  /** Creation date. */
  created_at: string;

  /** Close date (if closed). */
  closed_at: string | null;

  /** Whether this is a pull request. */
  pull_request?: { url: string };

  /** Labels. */
  labels: Array<{ name: string }>;
}
