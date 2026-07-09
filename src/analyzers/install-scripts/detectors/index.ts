/**
 * Detector registry — central registration of all AST detectors.
 */

import type { IDetector } from '../../interfaces.js';
import { EnvAccessDetector } from './env-access.js';
import { FilesystemDetector } from './filesystem.js';
import { NetworkDetector } from './network.js';
import { CredentialDetector } from './credential.js';
import { ExecDetector } from './exec.js';
import { ObfuscationDetector } from './obfuscation.js';

/**
 * Get all built-in AST detectors.
 */
export function getBuiltInDetectors(): IDetector[] {
  return [
    new EnvAccessDetector(),
    new FilesystemDetector(),
    new NetworkDetector(),
    new CredentialDetector(),
    new ExecDetector(),
    new ObfuscationDetector(),
  ];
}

/**
 * Get a detector by name.
 */
export function getDetectorByName(
  name: string,
  detectors: IDetector[] = getBuiltInDetectors(),
): IDetector | undefined {
  return detectors.find((d) => d.name === name);
}
