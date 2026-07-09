/**
 * CLI command: check <package>
 * The primary command — runs full analysis on a single package.
 */

import type { Command } from 'commander';
import { AnalysisEngine } from '../../core/engine.js';
import { NpmProvider } from '../../providers/npm/npm-provider.js';
import { GitHubProvider } from '../../providers/github/github-provider.js';
import { CacheManager } from '../../providers/cache/cache-manager.js';
import { TrustScorer } from '../../scoring/trust-scorer.js';
import { RuleEngine } from '../../rules/rule-engine.js';
import { registerBuiltInRules } from '../../rules/rule-registry.js';
import { HealthAnalyzer } from '../../analyzers/health/health-analyzer.js';
import { SupplyChainAnalyzer } from '../../analyzers/supply-chain/supply-chain-analyzer.js';
import { ScriptAnalyzer } from '../../analyzers/install-scripts/script-analyzer.js';
import { TyposquatAnalyzer } from '../../analyzers/typosquatting/typosquat-analyzer.js';
import { ExfiltrationAnalyzer } from '../../analyzers/exfiltration/exfiltration-analyzer.js';
import { TerminalReporter } from '../../reporters/terminal-reporter.js';
import { JsonReporter } from '../../reporters/json-reporter.js';
import { loadConfig } from '../../config/loader.js';
import { parsePackageSpec } from '../../types/common.js';
import { Logger } from '../ui/logger.js';
import { Spinner } from '../ui/spinner.js';

export function registerCheckCommand(program: Command): void {
  program
    .command('check <package>')
    .description('Run full security analysis on a package')
    .option('--json', 'Output results as JSON')
    .option('--no-cache', 'Disable caching')
    .option('--no-github', 'Skip GitHub analysis')
    .option('--version <version>', 'Specific version to analyze', 'latest')
    .action(async (packageArg: string, options: {
      json?: boolean;
      cache?: boolean;
      github?: boolean;
      version: string;
    }) => {
      const logger = new Logger({ quiet: options.json });
      const spinner = new Spinner();

      try {
        logger.banner();

        // Parse package specifier
        const spec = parsePackageSpec(packageArg);
        const version = spec.version ?? options.version;

        logger.info(`Analyzing ${spec.name}@${version}...`);
        spinner.start('Loading configuration...');

        // Load config
        const config = await loadConfig({
          cache: { enabled: options.cache !== false },
        });

        // Initialize providers
        const cache = config.cache.enabled
          ? new CacheManager(config.cache.directory)
          : undefined;

        const npmProvider = new NpmProvider(cache);
        const githubProvider = options.github !== false
          ? new GitHubProvider({ token: config.github.token }, cache)
          : undefined;

        // Initialize scoring and rules
        const scoringEngine = new TrustScorer(config.scoring.weights);
        const ruleEngine = new RuleEngine();
        registerBuiltInRules(ruleEngine);

        // Disable any user-configured rules
        for (const ruleId of config.disabledRules) {
          ruleEngine.disableRule(ruleId);
        }

        // Initialize engine
        const engine = new AnalysisEngine(
          npmProvider,
          githubProvider,
          scoringEngine,
          ruleEngine,
        );

        // Register analyzers
        engine.registerAnalyzers([
          new HealthAnalyzer(),
          new SupplyChainAnalyzer(),
          new ScriptAnalyzer(),
          new TyposquatAnalyzer(),
          new ExfiltrationAnalyzer(),
        ]);

        spinner.update('Fetching package metadata...');

        // Run analysis
        const result = await engine.analyze(spec.name, {
          version,
          concurrency: config.concurrency,
        });

        spinner.succeed('Analysis complete');

        // Output results
        if (options.json) {
          const reporter = new JsonReporter();
          await reporter.output(result);
        } else {
          const reporter = new TerminalReporter();
          await reporter.output(result);
        }

        // Exit with appropriate code
        const exitCode = getExitCode(result.highestSeverity);
        process.exitCode = exitCode;
      } catch (error) {
        spinner.fail('Analysis failed');
        logger.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 10;
      }
    });
}

function getExitCode(severity: string): number {
  switch (severity) {
    case 'critical':
      return 3;
    case 'high':
      return 2;
    case 'medium':
    case 'low':
      return 1;
    default:
      return 0;
  }
}
