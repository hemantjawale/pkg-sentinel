/**
 * Maintainer change tracker.
 * Compares maintainer lists between versions to detect additions and removals.
 */

import type { MaintainerChange } from '../../types/analysis.js';
import type { NpmPackageMetadata } from '../../providers/npm/types.js';
import { getNpmUsername } from '../../providers/npm/types.js';

/**
 * Detect maintainer changes across package versions.
 */
export function detectMaintainerChanges(
  metadata: NpmPackageMetadata,
): MaintainerChange[] {
  const changes: MaintainerChange[] = [];

  // Get versions sorted by time
  const sortedVersions = Object.entries(metadata.time)
    .filter(([key]) => key !== 'created' && key !== 'modified')
    .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());

  let previousMaintainers = new Set<string>();

  for (const [version] of sortedVersions) {
    const versionData = metadata.versions[version];
    if (!versionData?.maintainers) continue;

    const currentMaintainers = new Set(
      versionData.maintainers.map(getNpmUsername),
    );

    // Detect additions
    for (const maintainer of currentMaintainers) {
      if (!previousMaintainers.has(maintainer) && previousMaintainers.size > 0) {
        changes.push({
          type: 'added',
          username: maintainer,
          version,
          detectedAt: metadata.time[version] ?? '',
        });
      }
    }

    // Detect removals
    for (const maintainer of previousMaintainers) {
      if (!currentMaintainers.has(maintainer)) {
        changes.push({
          type: 'removed',
          username: maintainer,
          version,
          detectedAt: metadata.time[version] ?? '',
        });
      }
    }

    previousMaintainers = currentMaintainers;
  }

  return changes;
}
