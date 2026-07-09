/**
 * Unified cache manager implementing ICacheManager.
 * Wraps FileCache with the interface expected by providers.
 */

import type { ICacheManager } from '../interfaces.js';
import { FileCache } from './file-cache.js';

export class CacheManager implements ICacheManager {
  private readonly fileCache: FileCache;

  constructor(cacheDirectory: string) {
    this.fileCache = new FileCache(cacheDirectory);
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.fileCache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    return this.fileCache.set(key, value, ttlSeconds);
  }

  async has(key: string): Promise<boolean> {
    return this.fileCache.has(key);
  }

  async delete(key: string): Promise<void> {
    return this.fileCache.delete(key);
  }

  async clear(): Promise<void> {
    return this.fileCache.clear();
  }

  async stats(): Promise<{ size: number; keys: number }> {
    return this.fileCache.stats();
  }

  /** Evict expired entries and return count. */
  async evictExpired(): Promise<number> {
    return this.fileCache.evictExpired();
  }
}
