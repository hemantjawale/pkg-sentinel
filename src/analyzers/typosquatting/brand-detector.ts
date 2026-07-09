/**
 * Brand impersonation detector.
 */

import { BRAND_NAMES } from './popular-packages.js';

/** Result of brand impersonation detection. */
export interface BrandImpersonation {
  brand: string;
  packageName: string;
  confidence: number;
  reason: string;
}

/**
 * Detect potential brand impersonation in a package name.
 */
export function detectBrandImpersonation(packageName: string): BrandImpersonation[] {
  const results: BrandImpersonation[] = [];
  const name = packageName.replace(/^@[^/]+\//, '').toLowerCase();

  for (const brand of BRAND_NAMES) {
    // Exact brand name with prefix/suffix
    if (name !== brand && name.includes(brand)) {
      // Check if it's a legitimate scoped package or clearly official
      const stripped = name.replace(brand, '');

      // Skip if the remaining part is substantial (likely legitimate)
      if (stripped.replace(/[-_.]/g, '').length >= brand.length) continue;

      // Suspicious patterns: brand-helper, fake-brand, brand123, etc.
      const suspiciousPrefixes = ['fake-', 'free-', 'my-', 'new-', 'the-', 'real-', 'true-', 'original-'];
      const suspiciousSuffixes = ['-free', '-pro', '-plus', '-official', '-real', '-original', '-helper'];

      for (const prefix of suspiciousPrefixes) {
        if (name.startsWith(prefix + brand)) {
          results.push({
            brand,
            packageName,
            confidence: 80,
            reason: `Suspicious prefix "${prefix}" before brand name "${brand}"`,
          });
        }
      }

      for (const suffix of suspiciousSuffixes) {
        if (name.endsWith(brand + suffix)) {
          results.push({
            brand,
            packageName,
            confidence: 75,
            reason: `Suspicious suffix "${suffix}" after brand name "${brand}"`,
          });
        }
      }
    }
  }

  return results;
}
