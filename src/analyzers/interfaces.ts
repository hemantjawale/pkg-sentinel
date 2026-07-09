/**
 * Analyzer interfaces — every analyzer implements IAnalyzer.
 * This is the core abstraction enabling independent, testable analysis modules.
 */

import type { AnalyzerResult } from '../types/analysis.js';
import type { AnalysisCategory } from '../types/common.js';
import type { AnalysisContext } from '../core/context.js';

/**
 * Interface for all analyzers.
 * Each analyzer focuses on a single category of analysis
 * and produces findings independent of other analyzers.
 */
export interface IAnalyzer {
  /** Unique identifier for this analyzer. */
  readonly name: string;

  /** Human-readable description. */
  readonly description: string;

  /** Which analysis category this analyzer covers. */
  readonly category: AnalysisCategory;

  /**
   * Run the analysis against the provided context.
   * Must be deterministic — same inputs produce same outputs.
   */
  analyze(context: AnalysisContext): Promise<AnalyzerResult>;

  /**
   * Check whether this analyzer can run given the current context.
   * For example, health analysis requires a GitHub repository URL.
   */
  canAnalyze(context: AnalysisContext): boolean;
}

/**
 * Interface for AST-based detectors used within the install script analyzer.
 * Each detector looks for a specific pattern or behavior in parsed code.
 */
export interface IDetector {
  /** Unique name of the detector. */
  readonly name: string;

  /** Human-readable description of what it detects. */
  readonly description: string;

  /**
   * Visitor definitions for @babel/traverse.
   * Returns an object of AST visitor functions.
   */
  getVisitors(context: DetectorContext): Record<string, (...args: unknown[]) => void>;
}

/** Context passed to each AST detector during traversal. */
export interface DetectorContext {
  /** File being analyzed. */
  filePath: string;

  /** Report a detection from this detector. */
  report(detection: DetectorFinding): void;
}

/** A detection reported by an AST detector. */
export interface DetectorFinding {
  /** Detector name that produced this. */
  detector: string;

  /** What type of behavior was detected. */
  type: string;

  /** Severity of the detection. */
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';

  /** Description of what was found. */
  description: string;

  /** Source location. */
  location?: {
    line: number;
    column: number;
  };

  /** Code snippet at the detection location. */
  codeSnippet?: string;
}
