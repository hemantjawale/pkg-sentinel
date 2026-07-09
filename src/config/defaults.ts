/**
 * Default configuration values.
 */

import type { PkgSentinelConfig } from '../types/config.js';
import { Severity, ReportFormat } from '../types/common.js';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PKG_SENTINEL_DIR = join(homedir(), '.pkg-sentinel');

export const DEFAULT_CONFIG: PkgSentinelConfig = {
  minSeverity: Severity.Info,
  reportFormat: ReportFormat.Terminal,
  cache: {
    enabled: true,
    directory: join(PKG_SENTINEL_DIR, 'cache'),
    npmTtlSeconds: 900,       // 15 minutes
    githubTtlSeconds: 3600,   // 1 hour
    maxSizeMb: 100,
  },
  github: {
    token: undefined,
    apiBaseUrl: 'https://api.github.com',
    maxRequestsPerHour: 5000,
  },
  scoring: {
    weights: {},
  },
  ai: {
    enabled: false,
    provider: 'none',
    apiKey: undefined,
    model: undefined,
    maxTokens: 1024,
  },
  plugins: {
    directories: [],
    packages: [],
    disabled: [],
  },
  snapshotDir: join(PKG_SENTINEL_DIR, 'snapshots'),
  concurrency: 5,
  ignoredPackages: [],
  disabledRules: [],
};
