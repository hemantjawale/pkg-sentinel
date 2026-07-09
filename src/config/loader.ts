/**
 * Configuration loader — merges defaults with user overrides.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PkgSentinelConfig, DeepPartial } from '../types/config.js';
import { DEFAULT_CONFIG } from './defaults.js';

/**
 * Load configuration from file and environment variables.
 */
export async function loadConfig(
  overrides?: DeepPartial<PkgSentinelConfig>,
): Promise<PkgSentinelConfig> {
  let fileConfig: DeepPartial<PkgSentinelConfig> = {};

  // Try loading config file from current directory
  const configPaths = [
    '.pkg-sentinel.json',
    '.pkg-sentinelrc',
    '.pkg-sentinelrc.json',
  ];

  for (const configPath of configPaths) {
    try {
      const content = await readFile(join(process.cwd(), configPath), 'utf-8');
      fileConfig = JSON.parse(content);
      break;
    } catch {
      // Config file not found — that's fine
    }
  }

  // Merge: defaults < file config < programmatic overrides < env vars
  const merged = deepMerge(
    DEFAULT_CONFIG as unknown as Record<string, unknown>,
    fileConfig as Record<string, unknown>,
    overrides as Record<string, unknown> ?? {},
  ) as unknown as PkgSentinelConfig;

  // Apply environment variable overrides
  if (process.env['GITHUB_TOKEN']) {
    merged.github.token = process.env['GITHUB_TOKEN'];
  }
  if (process.env['PKG_SENTINEL_AI_KEY']) {
    merged.ai.apiKey = process.env['PKG_SENTINEL_AI_KEY'];
    merged.ai.enabled = true;
  }
  if (process.env['PKG_SENTINEL_AI_PROVIDER']) {
    merged.ai.provider = process.env['PKG_SENTINEL_AI_PROVIDER'] as 'openai' | 'anthropic';
  }

  return merged;
}

/**
 * Deep merge utility — merges source objects into target.
 */
function deepMerge(...objects: Record<string, unknown>[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const obj of objects) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          typeof result[key] === 'object' &&
          result[key] !== null &&
          !Array.isArray(result[key])
        ) {
          result[key] = deepMerge(
            result[key] as Record<string, unknown>,
            value as Record<string, unknown>,
          );
        } else if (value !== undefined) {
          result[key] = value;
        }
      }
    }
  }

  return result;
}
