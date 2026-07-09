/**
 * Snapshot manager — save and load dependency snapshots.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DependencySnapshot } from './types.js';

export class SnapshotManager {
  /**
   * Save a snapshot to disk.
   */
  async save(snapshot: DependencySnapshot, path: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(snapshot, null, 2), 'utf-8');
  }

  /**
   * Load a snapshot from disk.
   */
  async load(path: string): Promise<DependencySnapshot> {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as DependencySnapshot;
  }

  /**
   * Check if a snapshot file exists.
   */
  async exists(path: string): Promise<boolean> {
    try {
      await readFile(path);
      return true;
    } catch {
      return false;
    }
  }
}
