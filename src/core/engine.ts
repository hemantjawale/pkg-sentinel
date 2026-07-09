/**
 * Core analysis engine — orchestrates the full analysis flow.
 */

import type { IAnalyzer } from '../analyzers/interfaces.js';
import type { INpmProvider, IGitHubProvider } from '../providers/interfaces.js';
import type { IScoringEngine } from '../scoring/interfaces.js';
import type { IRuleEngine, RuleEvaluationData } from '../rules/interfaces.js';
import type { AnalysisResult, AnalyzerResult, AnalysisSummary, Finding } from '../types/analysis.js';
import { AnalysisCategory, Severity, SEVERITY_ORDER, compareSeverity } from '../types/common.js';
import { AnalysisContext } from './context.js';
import { buildFetchPipeline, executePipeline } from './pipeline.js';
import { parallel } from '../utils/parallel.js';

/** Options for running the analysis engine. */
export interface EngineOptions {
  /** Maximum parallel analyzers. Default: 5. */
  concurrency?: number;

  /** Package version to analyze. Default: 'latest'. */
  version?: string;

  /** Categories to skip. */
  skipCategories?: AnalysisCategory[];
}

export class AnalysisEngine {
  private readonly analyzers: IAnalyzer[] = [];

  constructor(
    private readonly npmProvider: INpmProvider,
    private readonly githubProvider: IGitHubProvider | undefined,
    private readonly scoringEngine: IScoringEngine,
    private readonly ruleEngine: IRuleEngine,
  ) {}

  /** Register an analyzer. */
  registerAnalyzer(analyzer: IAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  /** Register multiple analyzers. */
  registerAnalyzers(analyzers: IAnalyzer[]): void {
    this.analyzers.push(...analyzers);
  }

  /**
   * Run the full analysis pipeline for a package.
   */
  async analyze(
    packageName: string,
    options: EngineOptions = {},
  ): Promise<AnalysisResult> {
    const { concurrency = 5, version = 'latest', skipCategories = [] } = options;

    // Create analysis context
    const context = new AnalysisContext(packageName, version);

    // Build and execute data-fetching pipeline
    const fetchStages = buildFetchPipeline(this.npmProvider, this.githubProvider);
    await executePipeline(fetchStages, context);

    // Filter analyzers
    const activeAnalyzers = this.analyzers.filter(
      (a) => !skipCategories.includes(a.category) && a.canAnalyze(context),
    );

    // Run analyzers in parallel
    const tasks = activeAnalyzers.map(
      (analyzer) => () => analyzer.analyze(context),
    );
    const parallelResults = await parallel(tasks, { concurrency });

    const analyzerResults: AnalyzerResult[] = parallelResults
      .filter((r) => r.success && r.value)
      .map((r) => r.value!);

    // Store script results back in context for exfiltration analyzer
    const scriptResult = analyzerResults.find((r) => r.category === AnalysisCategory.InstallScripts);
    if (scriptResult?.metadata['scriptResults']) {
      context.scriptAnalysisResults = scriptResult.metadata['scriptResults'] as typeof context.scriptAnalysisResults;
    }

    // Evaluate rules
    const ruleData = this.buildRuleData(context, analyzerResults);
    const ruleFindings = this.ruleEngine.evaluate(ruleData);

    // Gather all findings
    const allFindings: Finding[] = [
      ...analyzerResults.flatMap((r) => r.findings),
      ...ruleFindings,
    ].sort((a, b) => compareSeverity(b.severity, a.severity));

    // Calculate trust score
    const trustScore = this.scoringEngine.calculateTrustScore(analyzerResults);

    // Determine highest severity
    const highestSeverity = allFindings.length > 0
      ? allFindings[0]!.severity
      : Severity.Info;

    // Build summary
    const summary = this.buildSummary(analyzerResults, allFindings);

    return {
      packageName,
      packageVersion: context.packageVersion,
      analyzedAt: context.startedAt.toISOString(),
      totalDurationMs: context.elapsedMs,
      analyzerResults,
      findings: allFindings,
      trustScore,
      highestSeverity,
      summary,
    };
  }

  /** Build rule evaluation data from context and analyzer results. */
  private buildRuleData(
    context: AnalysisContext,
    results: AnalyzerResult[],
  ): RuleEvaluationData {
    const healthResult = results.find((r) => r.category === AnalysisCategory.Health);
    const scResult = results.find((r) => r.category === AnalysisCategory.SupplyChain);
    const scriptResult = results.find((r) => r.category === AnalysisCategory.InstallScripts);
    const typoResult = results.find((r) => r.category === AnalysisCategory.Typosquatting);

    return {
      packageName: context.packageName,
      packageVersion: context.packageVersion,
      npmData: context.npmMetadata as unknown as Record<string, unknown>,
      githubData: context.githubData as unknown as Record<string, unknown>,
      healthMetrics: healthResult?.metadata['metrics'] as Record<string, unknown>,
      supplyChainMetrics: scResult?.metadata['metrics'] as Record<string, unknown>,
      scriptResults: scriptResult?.metadata as Record<string, unknown>,
      typosquatData: typoResult?.metadata as Record<string, unknown>,
    };
  }

  /** Build analysis summary statistics. */
  private buildSummary(
    results: AnalyzerResult[],
    findings: Finding[],
  ): AnalysisSummary {
    const bySeverity = Object.fromEntries(
      Object.values(Severity).map((s) => [s, findings.filter((f) => f.severity === s).length]),
    ) as Record<Severity, number>;

    const byCategory = Object.fromEntries(
      Object.values(AnalysisCategory).map((c) => [c, findings.filter((f) => f.category === c).length]),
    ) as Record<AnalysisCategory, number>;

    return {
      totalFindings: findings.length,
      bySeverity,
      byCategory,
      analyzersRun: results.filter((r) => r.status === 'completed').length,
      analyzersFailed: results.filter((r) => r.status === 'failed').length,
      analyzersSkipped: results.filter((r) => r.status === 'skipped').length,
    };
  }
}
