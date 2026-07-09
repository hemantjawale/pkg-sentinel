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
    const metadata = await this.getPackageMetadata(packageName);
    const versionData = metadata.versions[version];

    if (!versionData) {
      throw new Error(
        `Version ${version} not found for package ${packageName}`,
      );
    }

    const files = new Map<string, string>();
    files.set('package.json', JSON.stringify(versionData, null, 2));

    try {
      const tarballUrl = versionData.dist.tarball;
      const response = await fetch(tarballUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch tarball from ${tarballUrl}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { Readable } = await import('node:stream');
      const tar = await import('tar');

      await new Promise<void>((resolve, reject) => {
        const readable = Readable.from(buffer);
        const parser = new tar.Parse();

        parser.on('entry', (entry) => {
          const isInteresting =
            entry.type === 'File' &&
            (entry.path.endsWith('.js') ||
              entry.path.endsWith('.ts') ||
              entry.path.endsWith('.json') ||
              entry.path.endsWith('.sh') ||
              entry.path.endsWith('.bat'));

          if (!isInteresting) {
            entry.resume();
            return;
          }

          const chunks: Buffer[] = [];
          entry.on('data', (chunk: Buffer) => chunks.push(chunk));
          entry.on('end', () => {
            const content = Buffer.concat(chunks).toString('utf-8');
            const cleanPath = entry.path.replace(/^package\//, '');
            files.set(cleanPath, content);
          });
        });

        parser.on('end', () => resolve());
        parser.on('error', (err) => reject(err));

        readable.pipe(parser);
      });
    } catch {
      // Fallback to only metadata package.json if download/extraction fails
    }

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
