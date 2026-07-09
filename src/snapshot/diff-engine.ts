/**
 * Diff engine — compares two snapshots and finds differences.
 */

import type { DependencySnapshot, SnapshotDiff, SnapshotChange, SnapshotEntry } from './types.js';

/**
 * Compare two snapshots and produce a diff.
 */
export function diffSnapshots(
  previous: DependencySnapshot,
  current: DependencySnapshot,
): SnapshotDiff {
  const prevMap = new Map(previous.dependencies.map((d) => [d.name, d]));
  const currMap = new Map(current.dependencies.map((d) => [d.name, d]));

  const added: SnapshotEntry[] = [];
  const removed: SnapshotEntry[] = [];
  const changed: SnapshotChange[] = [];

  // Find added and changed
  for (const [name, entry] of currMap) {
    const prevEntry = prevMap.get(name);
    if (!prevEntry) {
      added.push(entry);
    } else {
      const changes = diffEntries(prevEntry, entry);
      if (changes.length > 0) {
        changed.push({
          name,
          previous: prevEntry,
          current: entry,
          changes,
        });
      }
    }
  }

  // Find removed
  for (const [name, entry] of prevMap) {
    if (!currMap.has(name)) {
      removed.push(entry);
    }
  }

  return { added, removed, changed };
}

/**
 * Compare two snapshot entries and list what changed.
 */
function diffEntries(previous: SnapshotEntry, current: SnapshotEntry): string[] {
  const changes: string[] = [];

  if (previous.version !== current.version) {
    changes.push(`version: ${previous.version} → ${current.version}`);
  }

  if (previous.integrity !== current.integrity) {
    changes.push('integrity hash changed');
  }

  if (previous.publisher !== current.publisher) {
    changes.push(`publisher: ${previous.publisher ?? 'unknown'} → ${current.publisher ?? 'unknown'}`);
  }

  if (previous.hasInstallScripts !== current.hasInstallScripts) {
    changes.push(
      current.hasInstallScripts
        ? 'install scripts added'
        : 'install scripts removed',
    );
  }

  // Maintainer changes
  const prevMaintainers = new Set(previous.maintainers);
  const currMaintainers = new Set(current.maintainers);
  const addedMaintainers = current.maintainers.filter((m) => !prevMaintainers.has(m));
  const removedMaintainers = previous.maintainers.filter((m) => !currMaintainers.has(m));

  if (addedMaintainers.length > 0) {
    changes.push(`maintainers added: ${addedMaintainers.join(', ')}`);
  }
  if (removedMaintainers.length > 0) {
    changes.push(`maintainers removed: ${removedMaintainers.join(', ')}`);
  }

  return changes;
}
