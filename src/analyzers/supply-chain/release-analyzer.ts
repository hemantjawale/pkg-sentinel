/**
 * Release and dependency change analyzer.
 */

import type { NpmPackageMetadata } from '../../providers/npm/types.js';
import type { DependencyChange } from '../../types/analysis.js';

/**
 * Detect dependency additions and removals between consecutive versions.
 */
export function detectDependencyChanges(
  metadata: NpmPackageMetadata,
): { additions: DependencyChange[]; removals: DependencyChange[] } {
  const additions: DependencyChange[] = [];
  const removals: DependencyChange[] = [];

  const sortedVersions = Object.entries(metadata.time)
    .filter(([key]) => key !== 'created' && key !== 'modified')
    .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());

  let previousDeps = new Map<string, string>();

  for (const [version] of sortedVersions) {
    const versionData = metadata.versions[version];
    if (!versionData) continue;

    const currentDeps = new Map<string, string>(
      Object.entries(versionData.dependencies ?? {}),
    );

    // Detect additions
    for (const [dep, depVersion] of currentDeps) {
      if (!previousDeps.has(dep)) {
        additions.push({
          name: dep,
          type: 'added',
          version: depVersion,
          inVersion: version,
        });
      }
    }

    // Detect removals
    for (const [dep, depVersion] of previousDeps) {
      if (!currentDeps.has(dep)) {
        removals.push({
          name: dep,
          type: 'removed',
          version: depVersion,
          inVersion: version,
        });
      }
    }

    previousDeps = currentDeps;
  }

  return { additions, removals };
}

/**
 * Detect significant package size changes between versions.
 * Returns a message if the latest version has a significantly different size.
 */
export function detectSizeAnomalies(
  metadata: NpmPackageMetadata,
): { currentSize: number | null; previousSize: number | null; changePercent: number | null } {
  const sortedVersions = Object.entries(metadata.time)
    .filter(([key]) => key !== 'created' && key !== 'modified')
    .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime());

  if (sortedVersions.length < 2) {
    return { currentSize: null, previousSize: null, changePercent: null };
  }

  const latestVersion = sortedVersions[0]![0];
  const previousVersion = sortedVersions[1]![0];

  const latestData = metadata.versions[latestVersion];
  const previousData = metadata.versions[previousVersion];

  const currentSize = latestData?.dist?.unpackedSize ?? null;
  const previousSize = previousData?.dist?.unpackedSize ?? null;

  if (currentSize === null || previousSize === null || previousSize === 0) {
    return { currentSize, previousSize, changePercent: null };
  }

  const changePercent = ((currentSize - previousSize) / previousSize) * 100;

  return { currentSize, previousSize, changePercent };
}
