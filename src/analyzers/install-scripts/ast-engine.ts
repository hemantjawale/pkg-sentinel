/**
 * AST engine — parses JavaScript/TypeScript code and runs detectors.
 * Uses @babel/parser and @babel/traverse for proper AST analysis.
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { IDetector, DetectorFinding } from '../interfaces.js';
import type { ScriptDetection } from '../../types/analysis.js';
import { Severity } from '../../types/common.js';
import { getBuiltInDetectors } from './detectors/index.js';

/** Options for the AST engine. */
export interface AstEngineOptions {
  /** Custom detectors to use instead of (or in addition to) built-in ones. */
  detectors?: IDetector[];

  /** Whether to include built-in detectors. Default: true. */
  includeBuiltIn?: boolean;
}

/**
 * Parse and analyze JavaScript code using AST traversal.
 */
export function analyzeCode(
  code: string,
  filePath: string,
  options: AstEngineOptions = {},
): ScriptDetection[] {
  const { detectors: customDetectors = [], includeBuiltIn = true } = options;

  const detectors = [
    ...(includeBuiltIn ? getBuiltInDetectors() : []),
    ...customDetectors,
  ];

  // Parse the code into an AST
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'unambiguous',
      allowImportExportEverywhere: true,
      allowAwaitOutsideFunction: true,
      allowReturnOutsideFunction: true,
      allowSuperOutsideMethod: true,
      allowUndeclaredExports: true,
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'dynamicImport',
        'optionalChaining',
        'nullishCoalescingOperator',
        'topLevelAwait',
      ],
    });
  } catch {
    // If parsing fails, return a single detection noting the parse failure
    return [
      {
        detector: 'ast-engine',
        type: 'parse-failure',
        severity: Severity.Info,
        description: `Failed to parse ${filePath} — may contain syntax errors or unsupported syntax`,
        location: { file: filePath, line: 0, column: 0 },
      },
    ];
  }

  // Collect findings from all detectors
  const findings: DetectorFinding[] = [];

  // Build combined visitors from all detectors
  const visitors: Record<string, Array<(...args: unknown[]) => void>> = {};

  for (const detector of detectors) {
    const detectorVisitors = detector.getVisitors({
      filePath,
      report: (finding) => findings.push(finding),
    });

    for (const [nodeType, handler] of Object.entries(detectorVisitors)) {
      if (!visitors[nodeType]) {
        visitors[nodeType] = [];
      }
      visitors[nodeType].push(handler);
    }
  }

  // Create merged visitors for traverse
  const mergedVisitors: Record<string, (...args: unknown[]) => void> = {};
  for (const [nodeType, handlers] of Object.entries(visitors)) {
    mergedVisitors[nodeType] = (...args: unknown[]) => {
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch {
          // Don't let one detector crash others
        }
      }
    };
  }

  // Traverse the AST
  try {
    // @babel/traverse has a default export issue with ESM
    const traverseFn = (traverse as unknown as { default?: typeof traverse }).default ?? traverse;
    traverseFn(ast, mergedVisitors);
  } catch {
    // AST traversal failure — non-fatal
  }

  // Convert findings to ScriptDetection format
  return findings.map((f) => ({
    detector: f.detector,
    type: f.type,
    severity: f.severity as Severity,
    description: f.description,
    location: f.location
      ? { file: filePath, line: f.location.line, column: f.location.column }
      : undefined,
    codeSnippet: f.codeSnippet,
  }));
}
