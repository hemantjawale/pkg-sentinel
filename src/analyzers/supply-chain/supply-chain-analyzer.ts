/**
 * Supply chain analyzer — evaluates publishing integrity and metadata trust.
 */

import type { IAnalyzer } from '../interfaces.js';
import type { AnalyzerResult, SupplyChainMetrics } from '../../types/analysis.js';
import { AnalysisCategory, AnalysisStatus } from '../../types/common.js';
import type { AnalysisContext } from '../../core/context.js';
import { detectMaintainerChanges } from './maintainer-tracker.js';
import { detectPublisherChanges, hasProvenance, detectReleaseTimingAnomalies } from './provenance-checker.js';
import { detectDependencyChanges, detectSizeAnomalies } from './release-analyzer.js';

export class SupplyChainAnalyzer implements IAnalyzer {
  readonly name = 'supply-chain';
  readonly description = 'Evaluates supply chain integrity: maintainer changes, publishing provenance, dependency mutations';
  readonly category = AnalysisCategory.SupplyChain;

  canAnalyze(context: AnalysisContext): boolean {
    return context.npmMetadata !== undefined;
  }

  async analyze(context: AnalysisContext): Promise<AnalyzerResult> {
    const start = Date.now();

    try {
      if (!context.npmMetadata) {
        return {
          analyzer: this.name,
          category: this.category,
          status: AnalysisStatus.Skipped,
          findings: [],
          durationMs: Date.now() - start,
          metadata: {},
        };
      }

      const metrics = this.collectMetrics(context);

      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Completed,
        findings: [],
        durationMs: Date.now() - start,
        metadata: { metrics },
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

  private collectMetrics(context: AnalysisContext): SupplyChainMetrics {
    const metadata = context.npmMetadata!;
    const latestVersion = metadata['dist-tags']['latest'] ?? '';
    const latestData = metadata.versions[latestVersion];

    // Maintainer and publisher changes
    const maintainerChanges = detectMaintainerChanges(metadata);
    const publisherChanges = detectPublisherChanges(metadata);

    // Provenance
    const latestHasProvenance = latestData ? hasProvenance(latestData) : null;

    // Dependencies
    const { additions, removals } = detectDependencyChanges(metadata);

    // Size anomalies
    const sizeData = detectSizeAnomalies(metadata);

    // Release timing anomalies
    const releaseTimingAnomalies = detectReleaseTimingAnomalies(metadata);

    // Version count
    const versionCount = Object.keys(metadata.versions).length;

    // Integrity
    const integrityHash = latestData?.dist?.integrity ?? null;

    return {
      maintainerChanges,
      publisherChanges,
      isPublisherVerified: null, // Requires additional API check
      hasProvenance: latestHasProvenance,
      isOidcPublisher: null, // Would require provenance attestation parsing
      isCliPublish: null, // Would require attestation parsing
      dependencyAdditions: additions,
      dependencyRemovals: removals,
      packageSizeBytes: sizeData.currentSize,
      previousPackageSizeBytes: sizeData.previousSize,
      releaseTimingAnomalies,
      versionCount,
      ownershipChanges: [],
      integrityHash,
    };
  }
}
