/**
 * Install script analyzer — orchestrates AST analysis of install scripts.
 * Identifies dangerous patterns and suspicious combinations.
 */

import type { IAnalyzer } from '../interfaces.js';
import type { AnalyzerResult, ScriptAnalysisResult, SuspiciousCombination } from '../../types/analysis.js';
import { AnalysisCategory, AnalysisStatus, Severity, INSTALL_SCRIPT_HOOKS } from '../../types/common.js';
import type { AnalysisContext } from '../../core/context.js';
import { analyzeCode } from './ast-engine.js';

/** Combination rules: pairs of detection types that together indicate high risk. */
const COMBINATION_RULES: Array<{
  detections: string[];
  severity: Severity;
  reason: string;
}> = [
  {
    detections: ['process-env-read', 'http-request'],
    severity: Severity.Critical,
    reason: 'Reads environment variables and makes HTTP requests — potential secret exfiltration',
  },
  {
    detections: ['process-env-read', 'fetch-call'],
    severity: Severity.Critical,
    reason: 'Reads environment variables and uses fetch() — potential secret exfiltration',
  },
  {
    detections: ['process-env-access', 'network-module-import'],
    severity: Severity.Critical,
    reason: 'Accesses process.env and imports network module — potential exfiltration vector',
  },
  {
    detections: ['sensitive-file-access', 'network-module-import'],
    severity: Severity.Critical,
    reason: 'Reads sensitive files and has network access — data theft risk',
  },
  {
    detections: ['sensitive-file-access', 'fetch-call'],
    severity: Severity.Critical,
    reason: 'Reads sensitive files and makes fetch requests — data theft risk',
  },
  {
    detections: ['ssh-key-access', 'network-module-import'],
    severity: Severity.Critical,
    reason: 'Reads SSH keys and has network access — SSH key exfiltration',
  },
  {
    detections: ['ssh-key-access', 'fetch-call'],
    severity: Severity.Critical,
    reason: 'Reads SSH keys and makes fetch requests — SSH key exfiltration',
  },
  {
    detections: ['npmrc-access', 'network-module-import'],
    severity: Severity.Critical,
    reason: 'Reads .npmrc and has network access — npm token theft',
  },
  {
    detections: ['child-process-import', 'url-literal'],
    severity: Severity.High,
    reason: 'Uses child_process with URL references — may download and execute code',
  },
  {
    detections: ['process-execution', 'dangerous-command-string'],
    severity: Severity.High,
    reason: 'Executes shell commands containing dangerous utilities',
  },
  {
    detections: ['eval-usage', 'network-module-import'],
    severity: Severity.Critical,
    reason: 'Uses eval() with network access — remote code execution risk',
  },
  {
    detections: ['eval-usage', 'encoded-data'],
    severity: Severity.Critical,
    reason: 'Uses eval() with encoded data — obfuscated code execution',
  },
  {
    detections: ['function-constructor', 'encoded-data'],
    severity: Severity.Critical,
    reason: 'Uses Function() constructor with encoded data — obfuscated code execution',
  },
  {
    detections: ['homedir-access', 'sensitive-file-access'],
    severity: Severity.High,
    reason: 'Resolves home directory and accesses sensitive files — targeted credential theft',
  },
];

export class ScriptAnalyzer implements IAnalyzer {
  readonly name = 'install-scripts';
  readonly description = 'Analyzes install scripts using AST parsing to detect dangerous patterns';
  readonly category = AnalysisCategory.InstallScripts;

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

      const latestVersion = context.npmMetadata['dist-tags']['latest'] ?? '';
      const versionData = context.npmMetadata.versions[latestVersion];

      if (!versionData?.scripts) {
        return {
          analyzer: this.name,
          category: this.category,
          status: AnalysisStatus.Completed,
          findings: [],
          durationMs: Date.now() - start,
          metadata: { hasInstallScripts: false },
        };
      }

      const results: ScriptAnalysisResult[] = [];

      for (const hook of INSTALL_SCRIPT_HOOKS) {
        const script = versionData.scripts[hook];
        if (!script) continue;

        // Analyze the script command itself as code
        const detections = analyzeCode(
          // Wrap shell commands in a template to make them parseable
          wrapScriptForParsing(script),
          `${hook}-script`,
        );

        // Check for suspicious combinations
        const detectionTypes = detections.map((d) => d.type);
        const suspiciousCombinations = findSuspiciousCombinations(detectionTypes);

        results.push({
          hook,
          command: script,
          files: [],
          detections,
          suspiciousCombinations,
        });
      }

      return {
        analyzer: this.name,
        category: this.category,
        status: AnalysisStatus.Completed,
        findings: [],
        durationMs: Date.now() - start,
        metadata: {
          hasInstallScripts: results.length > 0,
          scriptResults: results,
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

/**
 * Wrap a shell script command for AST parsing.
 * If the script references a JS file (e.g., "node scripts/install.js"),
 * we can analyze that file. For inline commands, we wrap them.
 */
function wrapScriptForParsing(script: string): string {
  // If it's a node command running a file, mark that file for analysis
  if (/^node\s+/.test(script)) {
    // Extract the file path for later analysis
    return `require('child_process').execSync(${JSON.stringify(script)})`;
  }

  // For shell commands, wrap as a string being passed to exec
  return `require('child_process').execSync(${JSON.stringify(script)})`;
}

/**
 * Find suspicious combinations of detection types.
 */
function findSuspiciousCombinations(
  detectionTypes: string[],
): SuspiciousCombination[] {
  const combinations: SuspiciousCombination[] = [];
  const typeSet = new Set(detectionTypes);

  for (const rule of COMBINATION_RULES) {
    const allPresent = rule.detections.every((d) => typeSet.has(d));
    if (allPresent) {
      combinations.push({
        detections: rule.detections,
        severity: rule.severity,
        reason: rule.reason,
      });
    }
  }

  return combinations;
}
