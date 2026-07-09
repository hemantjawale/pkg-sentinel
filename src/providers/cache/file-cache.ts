/**
 * Filesystem-backed cache with TTL support.
 * Stores JSON files in a cache directory with expiry metadata.
 */

import { readFile, writeFile, mkdir, readdir, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { sha256 } from '../../utils/hash.js';

/** A cached entry stored on disk. */
interface CacheEntry<T> {
  /** The cached data. */
  data: T;

  /** Expiration timestamp (ms since epoch). */
  expiresAt: number;

  /** When the entry was created. */
  createdAt: number;
}

export class FileCache {
  constructor(private readonly directory: string) {}

  /** Ensure the cache directory exists. */
  private async ensureDir(): Promise<void> {
    await mkdir(this.directory, { recursive: true });
  }

  /** Get the file path for a cache key. */
  private keyToPath(key: string): string {
    const hash = sha256(key);
    return join(this.directory, `${hash}.json`);
  }

  /** Get a cached value. Returns undefined if not found or expired. */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const filePath = this.keyToPath(key);
      const content = await readFile(filePath, 'utf-8');
      const entry = JSON.parse(content) as CacheEntry<T>;

      if (Date.now() > entry.expiresAt) {
        // Expired — delete async, don't wait
        unlink(filePath).catch(() => {});
        return undefined;
      }

      return entry.data;
    } catch {
      return undefined;
    }
  }

  /** Set a value in the cache with a TTL in seconds. */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.ensureDir();

    const entry: CacheEntry<T> = {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
    };

    const filePath = this.keyToPath(key);
    await writeFile(filePath, JSON.stringify(entry), 'utf-8');
  }

  /** Check if a key exists and is not expired. */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /** Delete a specific key. */
  async delete(key: string): Promise<void> {
    try {
      await unlink(this.keyToPath(key));
    } catch {
      // Key doesn't exist — that's fine
    }
  }

  /** Clear the entire cache. */
  async clear(): Promise<void> {
    try {
      const files = await readdir(this.directory);
      await Promise.all(
        files
          .filter((f) => f.endsWith('.json'))
          .map((f) => unlink(join(this.directory, f)).catch(() => {})),
      );
    } catch {
      // Directory doesn't exist — that's fine
    }
  }

  /** Get cache statistics. */
  async stats(): Promise<{ size: number; keys: number }> {
    try {
      const files = await readdir(this.directory);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      let totalSize = 0;
      for (const file of jsonFiles) {
        try {
          const fileStat = await stat(join(this.directory, file));
          totalSize += fileStat.size;
        } catch {
          // File may have been deleted
        }
      }

      return { size: totalSize, keys: jsonFiles.length };
    } catch {
      return { size: 0, keys: 0 };
    }
  }

  /** Evict expired entries. */
  async evictExpired(): Promise<number> {
    let evicted = 0;
    try {
      const files = await readdir(this.directory);
      for (const file of files.filter((f) => f.endsWith('.json'))) {
        try {
          const filePath = join(this.directory, file);
          const content = await readFile(filePath, 'utf-8');
          const entry = JSON.parse(content) as CacheEntry<unknown>;
          if (Date.now() > entry.expiresAt) {
            await unlink(filePath);
            evicted++;
          }
        } catch {
          // Skip corrupt entries
        }
      }
    } catch {
      // Directory doesn't exist
    }
    return evicted;
  }
}
