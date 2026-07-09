/**
 * Analysis result types — the output of every analyzer and the overall engine.
 */

import type { AnalysisCategory, AnalysisStatus, Severity } from './common.js';
import type { TrustScore } from './scores.js';

/** A single finding from an analyzer. */
export interface Finding {
  /** Unique rule identifier that triggered this finding. */
  ruleId: string;

  /** Short title of the finding. */
  title: string;

  /** Detailed description of what was detected. */
  description: string;

  /** Severity level. */
  severity: Severity;

  /** Analysis category this finding belongs to. */
  category: AnalysisCategory;

  /** Evidence supporting the finding (e.g. code snippet, metadata). */
  evidence: Evidence[];

  /** Suggested remediation steps. */
  remediation?: string;

  /** URL for more information about this rule. */
  documentationUrl?: string;

  /** Confidence level 0–100 for heuristic detections. */
  confidence: number;

  /** Metadata key-value pairs for additional context. */
  metadata: Record<string, unknown>;
}

/** Evidence supporting a finding. */
export interface Evidence {
  /** Type of evidence. */
  type: EvidenceType;

  /** Description of the evidence. */
  description: string;

  /** The actual evidence data (code, URL, value, etc.). */
  value: string;

  /** Source file or location, if applicable. */
  source?: string;

  /** Line number in the source, if applicable. */
  line?: number;

  /** Column number in the source, if applicable. */
  column?: number;
}

/** Types of evidence that can be attached to findings. */
export enum EvidenceType {
  CodeSnippet = 'code-snippet',
  AstNode = 'ast-node',
  Metadata = 'metadata',
  Url = 'url',
  Comparison = 'comparison',
  Timeline = 'timeline',
}

/** Result from a single analyzer run. */
export interface AnalyzerResult {
  /** Which analyzer produced this result. */
  analyzer: string;

  /** Analysis category. */
  category: AnalysisCategory;

  /** Status of the analysis run. */
  status: AnalysisStatus;

  /** Findings produced by the analyzer. */
  findings: Finding[];

  /** Duration of the analysis in milliseconds. */
  durationMs: number;

  /** Error message if the analysis failed. */
  error?: string;

  /** Analyzer-specific metadata. */
  metadata: Record<string, unknown>;
}

/** Complete analysis result for a package. */
export interface AnalysisResult {
  /** Package that was analyzed. */
  packageName: string;

  /** Version that was analyzed (or 'latest'). */
  packageVersion: string;

  /** Timestamp when analysis started. */
  analyzedAt: string;

  /** Total analysis duration in milliseconds. */
  totalDurationMs: number;

  /** Individual analyzer results. */
  analyzerResults: AnalyzerResult[];

  /** All findings across all analyzers, sorted by severity. */
  findings: Finding[];

  /** Computed trust score. */
  trustScore: TrustScore;

  /** Highest severity finding. */
  highestSeverity: Severity;

  /** AI-generated explanation (if enabled). */
  aiExplanation?: AIExplanation;

  /** Summary statistics. */
  summary: AnalysisSummary;
}

/** AI-generated explanation of analysis results. */
export interface AIExplanation {
  /** Overall risk summary. */
  summary: string;

  /** Detailed risk explanation. */
  riskExplanation: string;

  /** Developer-friendly remediation steps. */
  remediation: string[];

  /** Suggested alternative packages. */
  alternatives: string[];

  /** Upgrade recommendation. */
  upgradeRecommendation?: string;

  /** Confidence level in the explanation. */
  confidenceLevel: string;

  /** AI model used. */
  model: string;

  /** Disclaimer that AI summarizes existing analysis only. */
  disclaimer: string;
}

/** Summary statistics for an analysis run. */
export interface AnalysisSummary {
  /** Total findings count. */
  totalFindings: number;

  /** Count by severity. */
  bySeverity: Record<Severity, number>;

  /** Count by category. */
  byCategory: Record<AnalysisCategory, number>;

  /** Number of analyzers that ran. */
  analyzersRun: number;

  /** Number of analyzers that failed. */
  analyzersFailed: number;

  /** Number of analyzers that were skipped. */
  analyzersSkipped: number;
}

/** Health-specific metrics produced by the health analyzer. */
export interface HealthMetrics {
  githubStars: number | null;
  contributorCount: number | null;
  activeMaintainers: number | null;
  lastCommitDate: string | null;
  releaseFrequencyDays: number | null;
  openIssueCount: number | null;
  closedIssueRatio: number | null;
  avgIssueResponseTimeHours: number | null;
  isArchived: boolean | null;
  repositoryAgeDays: number | null;
  commitFrequencyPerWeek: number | null;
  maintainerCount: number | null;
  busFactorEstimate: number | null;
  weeklyDownloads: number | null;
  recentReleaseCadenceDays: number | null;
}

/** Supply-chain specific metadata. */
export interface SupplyChainMetrics {
  maintainerChanges: MaintainerChange[];
  publisherChanges: PublisherChange[];
  isPublisherVerified: boolean | null;
  hasProvenance: boolean | null;
  isOidcPublisher: boolean | null;
  isCliPublish: boolean | null;
  dependencyAdditions: DependencyChange[];
  dependencyRemovals: DependencyChange[];
  packageSizeBytes: number | null;
  previousPackageSizeBytes: number | null;
  releaseTimingAnomalies: string[];
  versionCount: number | null;
  ownershipChanges: string[];
  integrityHash: string | null;
}

/** A maintainer change event. */
export interface MaintainerChange {
  type: 'added' | 'removed';
  username: string;
  version: string;
  detectedAt: string;
}

/** A publisher change event. */
export interface PublisherChange {
  previousPublisher: string;
  newPublisher: string;
  version: string;
  detectedAt: string;
}

/** A dependency addition or removal. */
export interface DependencyChange {
  name: string;
  type: 'added' | 'removed';
  version: string;
  inVersion: string;
}

/** Install script analysis result for a single script. */
export interface ScriptAnalysisResult {
  /** Which lifecycle hook this script belongs to. */
  hook: string;

  /** The raw script command. */
  command: string;

  /** File(s) the script executes. */
  files: string[];

  /** Detected capabilities/behaviors. */
  detections: ScriptDetection[];

  /** Suspicious combinations found. */
  suspiciousCombinations: SuspiciousCombination[];
}

/** A single detection from the AST analysis. */
export interface ScriptDetection {
  /** Detector that found this. */
  detector: string;

  /** What was detected. */
  type: string;

  /** Severity of the detection. */
  severity: Severity;

  /** Description of what was found. */
  description: string;

  /** Source location. */
  location?: {
    file: string;
    line: number;
    column: number;
  };

  /** Code snippet. */
  codeSnippet?: string;
}

/** A suspicious combination of detections. */
export interface SuspiciousCombination {
  /** Detections that form this combination. */
  detections: string[];

  /** Resulting severity. */
  severity: Severity;

  /** Why this combination is suspicious. */
  reason: string;
}
