/**
 * Exfiltration pattern matcher.
 * Detects suspicious combinations that indicate data theft.
 */

import type { ScriptDetection, SuspiciousCombination } from '../../types/analysis.js';
import { Severity } from '../../types/common.js';

/** Exfiltration risk pattern. */
interface ExfiltrationPattern {
  source: string[];
  sink: string[];
  severity: Severity;
  description: string;
}

/** Patterns that indicate credential/secret exfiltration. */
const EXFILTRATION_PATTERNS: ExfiltrationPattern[] = [
  {
    source: ['process-env-read', 'process-env-access'],
    sink: ['http-request', 'fetch-call', 'http-get', 'network-module-import'],
    severity: Severity.Critical,
    description: 'Environment variables read and sent over network — credential exfiltration',
  },
  {
    source: ['ssh-key-access'],
    sink: ['http-request', 'fetch-call', 'http-get', 'network-module-import'],
    severity: Severity.Critical,
    description: 'SSH keys read and sent over network — SSH key theft',
  },
  {
    source: ['npmrc-access', 'npm-token'],
    sink: ['http-request', 'fetch-call', 'http-get', 'network-module-import'],
    severity: Severity.Critical,
    description: 'npm credentials read and sent over network — npm token theft',
  },
  {
    source: ['git-credential-access'],
    sink: ['http-request', 'fetch-call', 'http-get', 'network-module-import'],
    severity: Severity.Critical,
    description: 'Git credentials read and sent over network — git credential theft',
  },
  {
    source: ['browser-credential-access'],
    sink: ['http-request', 'fetch-call', 'http-get', 'network-module-import'],
    severity: Severity.Critical,
    description: 'Browser credentials read and sent over network — browser credential theft',
  },
  {
    source: ['sensitive-file-access'],
    sink: ['http-request', 'fetch-call', 'http-get', 'network-module-import'],
    severity: Severity.High,
    description: 'Sensitive files read and sent over network — data exfiltration',
  },
  {
    source: ['aws-key', 'aws-secret'],
    sink: ['http-request', 'fetch-call', 'http-get'],
    severity: Severity.Critical,
    description: 'AWS credentials read and sent over network — cloud credential theft',
  },
];

/**
 * Match exfiltration patterns against script detections.
 */
export function matchExfiltrationPatterns(
  detections: ScriptDetection[],
): SuspiciousCombination[] {
  const detectionTypes = new Set(detections.map((d) => d.type));
  const matches: SuspiciousCombination[] = [];

  for (const pattern of EXFILTRATION_PATTERNS) {
    const hasSource = pattern.source.some((s) => detectionTypes.has(s));
    const hasSink = pattern.sink.some((s) => detectionTypes.has(s));

    if (hasSource && hasSink) {
      const matchedSource = pattern.source.filter((s) => detectionTypes.has(s));
      const matchedSink = pattern.sink.filter((s) => detectionTypes.has(s));

      matches.push({
        detections: [...matchedSource, ...matchedSink],
        severity: pattern.severity,
        reason: pattern.description,
      });
    }
  }

  return matches;
}
