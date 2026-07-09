/**
 * Library entry point — exports the public API for programmatic usage.
 */

// Core engine
export { AnalysisEngine } from './core/engine.js';
export type { EngineOptions } from './core/engine.js';
export { AnalysisContext } from './core/context.js';

// Providers
export { NpmProvider } from './providers/npm/npm-provider.js';
export { GitHubProvider } from './providers/github/github-provider.js';
export { CacheManager } from './providers/cache/cache-manager.js';

// Analyzers
export { HealthAnalyzer } from './analyzers/health/health-analyzer.js';
export { SupplyChainAnalyzer } from './analyzers/supply-chain/supply-chain-analyzer.js';
export { ScriptAnalyzer } from './analyzers/install-scripts/script-analyzer.js';
export { TyposquatAnalyzer } from './analyzers/typosquatting/typosquat-analyzer.js';
export { ExfiltrationAnalyzer } from './analyzers/exfiltration/exfiltration-analyzer.js';

// Scoring
export { TrustScorer } from './scoring/trust-scorer.js';

// Rules
export { RuleEngine } from './rules/rule-engine.js';
export { registerBuiltInRules } from './rules/rule-registry.js';

// Reporters
export { TerminalReporter } from './reporters/terminal-reporter.js';
export { JsonReporter } from './reporters/json-reporter.js';
export { HtmlReporter } from './reporters/html-reporter.js';
export { MarkdownReporter } from './reporters/markdown-reporter.js';
export { CiReporter } from './reporters/ci-reporter.js';

// Plugins
export { PluginLoader } from './plugins/plugin-loader.js';
export { PluginRegistry } from './plugins/plugin-registry.js';

// Config
export { loadConfig } from './config/loader.js';
export { DEFAULT_CONFIG } from './config/defaults.js';

// Types
export type {
  AnalysisResult,
  AnalyzerResult,
  Finding,
  Evidence,
  AIExplanation,
  HealthMetrics,
  SupplyChainMetrics,
} from './types/analysis.js';
export type { TrustScore, CategoryScore, MetricScore, WeightDefinition } from './types/scores.js';
export type { PkgSentinelConfig } from './types/config.js';
export {
  Severity,
  AnalysisCategory,
  AnalysisStatus,
  ExitCode,
  ReportFormat,
  TrustLevel,
} from './types/common.js';

// Interfaces
export type { IAnalyzer, IDetector } from './analyzers/interfaces.js';
export type { IScoringEngine, ICategoryScorer } from './scoring/interfaces.js';
export type { IRule, IRuleEngine, RuleEvaluationData } from './rules/interfaces.js';
export type { INpmProvider, IGitHubProvider, ICacheManager } from './providers/interfaces.js';
export type { IReporter } from './reporters/interfaces.js';
export type { IPlugin, IPluginLoader, IPluginRegistry, PluginMetadata } from './plugins/interfaces.js';
export type { IAIExplainer } from './ai/interfaces.js';
