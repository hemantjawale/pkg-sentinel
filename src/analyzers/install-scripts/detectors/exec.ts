/**
 * AST detector: Shell/process execution.
 * Detects child_process usage, shell commands, and system utilities.
 */

import type { IDetector, DetectorContext } from '../../interfaces.js';

/** Dangerous shell commands that may indicate malicious behavior. */
const DANGEROUS_COMMANDS = [
  'curl',
  'wget',
  'powershell',
  'certutil',
  'bitsadmin',
  'cmd.exe',
  'bash -c',
  '/bin/sh',
  '/bin/bash',
  'cmd /c',
  'Start-Process',
  'Invoke-WebRequest',
  'Invoke-Expression',
  'IEX',
  'nslookup',
  'whoami',
  'hostname',
  'ifconfig',
  'ipconfig',
];

export class ExecDetector implements IDetector {
  readonly name = 'exec';
  readonly description = 'Detects child_process usage, shell execution, and dangerous system commands';

  getVisitors(ctx: DetectorContext): Record<string, (...args: unknown[]) => void> {
    return {
      CallExpression(path: { node: { callee: { name?: string; object?: { name?: string }; property?: { name?: string } }; arguments: Array<{ value?: string }> } }) {
        const node = path.node;
        const callee = node.callee;

        // require('child_process')
        if (
          callee.name === 'require' &&
          (node.arguments[0]?.value === 'child_process' ||
            node.arguments[0]?.value === 'node:child_process')
        ) {
          ctx.report({
            detector: 'exec',
            type: 'child-process-import',
            severity: 'high',
            description: `Imports child_process module`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // exec(), execSync(), spawn(), spawnSync(), execFile()
        const execMethods = ['exec', 'execSync', 'spawn', 'spawnSync', 'execFile', 'execFileSync', 'fork'];
        if (
          callee.property?.name &&
          execMethods.includes(callee.property.name)
        ) {
          const command = node.arguments[0]?.value ?? '<dynamic>';
          const severity = isDangerousCommand(command) ? 'critical' : 'high';

          ctx.report({
            detector: 'exec',
            type: 'process-execution',
            severity,
            description: `Executes shell command via ${callee.property.name}(): "${command}"`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // Direct exec/execSync calls (destructured)
        if (
          callee.name &&
          execMethods.includes(callee.name)
        ) {
          const command = node.arguments[0]?.value ?? '<dynamic>';
          const severity = isDangerousCommand(command) ? 'critical' : 'high';

          ctx.report({
            detector: 'exec',
            type: 'process-execution',
            severity,
            description: `Executes shell command via ${callee.name}(): "${command}"`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },

      // Detect dangerous shell command strings
      StringLiteral(path: { node: { value: string; loc?: { start: { line: number; column: number } } } }) {
        const value = path.node.value;
        for (const cmd of DANGEROUS_COMMANDS) {
          if (value.includes(cmd)) {
            ctx.report({
              detector: 'exec',
              type: 'dangerous-command-string',
              severity: 'high',
              description: `Contains dangerous command reference: "${cmd}" in "${value}"`,
              location: path.node.loc?.start,
            });
            break;
          }
        }
      },
    };
  }
}

/** Check if a command string contains dangerous patterns. */
function isDangerousCommand(command: string): boolean {
  return DANGEROUS_COMMANDS.some((cmd) => command.includes(cmd));
}
