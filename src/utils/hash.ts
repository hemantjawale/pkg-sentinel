/**
 * Hash and integrity utilities.
 */

import { createHash } from 'node:crypto';

/**
 * Compute SHA-256 hash of a string.
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex');
}

/**
 * Compute SHA-512 hash of a string or buffer.
 */
export function sha512(data: string | Buffer): string {
  return createHash('sha512').update(data).digest('hex');
}

/**
 * Compute SHA-512 hash in base64 format (used in npm integrity).
 */
export function sha512Base64(data: string | Buffer): string {
  return 'sha512-' + createHash('sha512').update(data).digest('base64');
}

/**
 * Verify an npm-style integrity hash.
 * Format: "sha512-<base64hash>"
 */
export function verifyIntegrity(data: string | Buffer, expectedIntegrity: string): boolean {
  const [algorithm, expectedHash] = expectedIntegrity.split('-', 2);
  if (!algorithm || !expectedHash) return false;

  try {
    const actualHash = createHash(algorithm).update(data).digest('base64');
    return actualHash === expectedHash;
  } catch {
    return false;
  }
}

/**
 * Generate a cache key from an object by hashing its JSON representation.
 */
export function cacheKey(...parts: string[]): string {
  return sha256(parts.join(':'));
}
