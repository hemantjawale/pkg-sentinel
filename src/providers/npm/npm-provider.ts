/**
 * npm registry data provider.
 * Fetches package metadata, downloads, and tarball data.
 */

import type { INpmProvider, ICacheManager } from '../interfaces.js';
import type { NpmPackageMetadata, NpmDownloads } from './types.js';
import { httpRequest, HttpError } from '../../utils/http.js';

const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_API = 'https://api.npmjs.org';

export class NpmProvider implements INpmProvider {
  constructor(private readonly cache?: ICacheManager) {}

  async getPackageMetadata(packageName: string): Promise<NpmPackageMetadata> {
    const cacheKey = `npm:metadata:${packageName}`;

    if (this.cache) {
      const cached = await this.cache.get<NpmPackageMetadata>(cacheKey);
      if (cached) return cached;
    }

    const encodedName = encodePackageName(packageName);
    const response = await httpRequest<NpmPackageMetadata>(
      `${NPM_REGISTRY}/${encodedName}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new NpmPackageNotFoundError(packageName);
      }
      throw new HttpError(
        `npm registry returned ${response.status} for ${packageName}`,
        response.status,
        `${NPM_REGISTRY}/${encodedName}`,
      );
    }

    if (this.cache) {
      await this.cache.set(cacheKey, response.data, 900); // 15 min TTL
    }

    return response.data;
  }

  async getDownloads(
    packageName: string,
    period = 'last-week',
  ): Promise<NpmDownloads> {
    const cacheKey = `npm:downloads:${packageName}:${period}`;

    if (this.cache) {
      const cached = await this.cache.get<NpmDownloads>(cacheKey);
      if (cached) return cached;
    }

    const encodedName = encodePackageName(packageName);
    const response = await httpRequest<NpmDownloads>(
      `${NPM_API}/downloads/point/${period}/${encodedName}`,
    );

    if (!response.ok) {
      // Downloads API returns 0 for unknown packages, not 404
      return {
        downloads: 0,
        start: '',
        end: '',
        package: packageName,
      };
    }

    if (this.cache) {
      await this.cache.set(cacheKey, response.data, 3600); // 1 hour TTL
    }

    return response.data;
  }

  async getTarballUrl(
    packageName: string,
    version: string,
  ): Promise<string> {
    const metadata = await this.getPackageMetadata(packageName);
    const versionData = metadata.versions[version];

    if (!versionData) {
      throw new Error(
        `Version ${version} not found for package ${packageName}`,
      );
    }

    return versionData.dist.tarball;
  }

  async getPackageFiles(
    packageName: string,
    version: string,
  ): Promise<Map<string, string>> {
    // In a full implementation, this would download and extract the tarball.
    // For now, we extract script files from the version metadata.
    const metadata = await this.getPackageMetadata(packageName);
    const versionData = metadata.versions[version];

    if (!versionData) {
      throw new Error(
        `Version ${version} not found for package ${packageName}`,
      );
    }

    const files = new Map<string, string>();

    // Include package.json as a file so analyzers can inspect scripts
    files.set('package.json', JSON.stringify(versionData, null, 2));

    return files;
  }
}

/** Properly encode scoped package names for URLs. */
function encodePackageName(name: string): string {
  if (name.startsWith('@')) {
    return '@' + encodeURIComponent(name.slice(1));
  }
  return encodeURIComponent(name);
}

/** Error thrown when a package is not found on npm. */
export class NpmPackageNotFoundError extends Error {
  constructor(public readonly packageName: string) {
    super(`Package "${packageName}" not found on npm registry`);
    this.name = 'NpmPackageNotFoundError';
  }
}
