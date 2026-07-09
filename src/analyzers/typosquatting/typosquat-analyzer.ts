/**
 * Typosquatting analyzer — detects package name impersonation.
 */

import type { IAnalyzer } from '../interfaces.js';
import type { AnalyzerResult } from '../../types/analysis.js';
import { AnalysisCategory, AnalysisStatus, Severity } from '../../types/common.js';
import type { AnalysisContext } from '../../core/context.js';
import { levenshteinDistance, normalizedSimilarity, detectTyposquatPatterns } from './levenshtein.js';
import { POPULAR_PACKAGES } from './popular-packages.js';
import { detectBrandImpersonation } from './brand-detector.js';

/** Maximum Levenshtein distance to consider a potential typosquat. */
const MAX_DISTANCE = 2;

/** Minimum similarity score to flag. */
const MIN_SIMILARITY = 0.85;

export class TyposquatAnalyzer implements IAnalyzer {
  readonly name = 'typosquatting';
  readonly description = 'Detects potential typosquatting and brand impersonation';
  readonly category = AnalysisCategory.Typosquatting;

  canAnalyze(_context: AnalysisContext): boolean {
    return true; // Can always analyze the package name
  }

  async analyze(context: AnalysisContext): Promise<AnalyzerResult> {
    const start = Date.now();

    try {
      const packageName = context.packageName;
      const results: TyposquatResult[] = [];

      // Skip if the package itself is in the popular list
      if (POPULAR_PACKAGES.includes(packageName)) {
        return {
          analyzer: this.name,
          category: this.category,
          status: AnalysisStatus.Completed,
          findings: [],
          durationMs: Date.now() - start,
          metadata: { isPopularPackage: true },
        };
      }

      // Check against popular packages
      for (const popular of POPULAR_PACKAGES) {
        const distance = levenshteinDistance(packageName, popular);
        const similarity = normalizedSimilarity(packageName, popular);

        if (distance <= MAX_DISTANCE && distance > 0) {
          const patterns = detectTyposquatPatterns(packageName, popular);
          const confidence = Math.max(
            similarity * 100,
            ...patterns.map((p) => p.confidence),
          );

          results.push({
            legitimatePackage: popular,
            distance,
            similarity,
            patterns,
            confidence,
          });
        } else if (similarity >= MIN_SIMILARITY && packageName !== popular) {
          results.push({
            legitimatePackage: popular,
            distance,
            similarity,
            patterns: [],
            confidence: similarity * 100,
          });
        }
      }

      // Check for brand impersonation
      const brandResults = detectBrandImpersonation(packageName);

      // Determine severity based on findings
      let severity = Severity.Info;
      if (results.some((r) => r.confidence >= 90)) {
        severity = Severity.Critical;
      } else if (results.some((r) => r.confidence >= 75)) {
        severity = Severity.High;
      } else if (results.length > 0 || brandResults.length > 0) {
        severity = Severity.Medium;
      }

      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Completed,
        findings: [],
        durationMs: Date.now() - start,
        metadata: {
          typosquatResults: results,
          brandImpersonation: brandResults,
          highestSeverity: severity,
          isPopularPackage: false,
        },
      };
    } catch (error) {
      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Failed,
        findings: [],
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
        metadata: {},
      };
    }
  }
}

/** Internal result type for typosquatting analysis. */
interface TyposquatResult {
  legitimatePackage: string;
  distance: number;
  similarity: number;
  patterns: Array<{ type: string; description: string; confidence: number }>;
  confidence: number;
}
