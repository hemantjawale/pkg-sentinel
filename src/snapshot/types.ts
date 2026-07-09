/**
 * Snapshot types.
 */

export interface DependencySnapshot {
  /** When the snapshot was created. */
  createdAt: string;

  /** Package name for single-package snapshots, or project name for audit snapshots. */
  name: string;

  /** Dependencies in the snapshot. */
  dependencies: SnapshotEntry[];

  /** Metadata about the snapshot. */
  metadata: Record<string, unknown>;
}

export interface SnapshotEntry {
  /** Package name. */
  name: string;

  /** Package version. */
  version: string;

  /** Maintainers at snapshot time. */
  maintainers: string[];

  /** Package integrity hash. */
  integrity: string | null;

  /** Whether the package has install scripts. */
  hasInstallScripts: boolean;

  /** Publisher username. */
  publisher: string | null;

  /** Dependencies of this package. */
  dependencies: string[];
}

export interface SnapshotDiff {
  /** Added dependencies. */
  added: SnapshotEntry[];

  /** Removed dependencies. */
  removed: SnapshotEntry[];

  /** Dependencies with changes. */
  changed: SnapshotChange[];
}

export interface SnapshotChange {
  /** Package name. */
  name: string;

  /** Previous state. */
  previous: SnapshotEntry;

  /** Current state. */
  current: SnapshotEntry;

  /** What changed. */
  changes: string[];
}
