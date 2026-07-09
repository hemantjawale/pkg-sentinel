/**
 * Provenance and publisher verification checker.
 */

import type { NpmPackageMetadata, NpmVersionMetadata } from '../../providers/npm/types.js';
import type { PublisherChange } from '../../types/analysis.js';
import { getNpmUsername } from '../../providers/npm/types.js';

/**
 * Check if a version has publishing provenance (SLSA/Sigstore attestation).
 */
export function hasProvenance(versionData: NpmVersionMetadata): boolean {
  return versionData.dist.attestations?.provenance !== undefined;
}

/**
 * Detect publisher changes across versions.
 */
export function detectPublisherChanges(
  metadata: NpmPackageMetadata,
): PublisherChange[] {
  const changes: PublisherChange[] = [];

  const sortedVersions = Object.entries(metadata.time)
    .filter(([key]) => key !== 'created' && key !== 'modified')
    .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());

  let previousPublisher: string | null = null;

  for (const [version] of sortedVersions) {
    const versionData = metadata.versions[version];
    if (!versionData?._npmUser) continue;

    const currentPublisher = getNpmUsername(versionData._npmUser);

    if (previousPublisher !== null && currentPublisher !== previousPublisher) {
      changes.push({
        previousPublisher,
        newPublisher: currentPublisher,
        version,
        detectedAt: metadata.time[version] ?? '',
      });
    }

    previousPublisher = currentPublisher;
  }

  return changes;
}

/**
 * Analyze release timing for anomalies.
 * Flags releases published at unusual times (weekends, odd hours, etc.).
 */
export function detectReleaseTimingAnomalies(
  metadata: NpmPackageMetadata,
): string[] {
  const anomalies: string[] = [];

  const sortedVersions = Object.entries(metadata.time)
    .filter(([key]) => key !== 'created' && key !== 'modified')
    .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime());

  // Check the most recent 10 versions
  const recentVersions = sortedVersions.slice(0, 10);

  for (const [version, timestamp] of recentVersions) {
    const date = new Date(timestamp);
    const hour = date.getUTCHours();
    const day = date.getUTCDay();

    // Unusual publish time: between midnight and 5am UTC
    if (hour >= 0 && hour < 5) {
      anomalies.push(
        `Version ${version} published at unusual hour (${hour}:00 UTC)`,
      );
    }

    // Weekend publish (less common for legitimate packages)
    if (day === 0 || day === 6) {
      // This is informational only — many legitimate publishes happen on weekends
    }
  }

  // Check for rapid-fire publishes (multiple versions in < 1 hour)
  for (let i = 0; i < recentVersions.length - 1; i++) {
    const current = recentVersions[i]!;
    const next = recentVersions[i + 1]!;
    const diffMs = new Date(current[1]).getTime() - new Date(next[1]).getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 60 && diffMinutes >= 0) {
      anomalies.push(
        `Versions ${next[0]} and ${current[0]} published within ${Math.round(diffMinutes)} minutes`,
      );
    }
  }

  return anomalies;
}
