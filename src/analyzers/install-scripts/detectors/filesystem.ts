/**
 * AST detector: Filesystem access.
 * Detects reading sensitive files (SSH keys, credentials, configs).
 */

import type { IDetector, DetectorContext } from '../../interfaces.js';

/** Sensitive file paths that should raise concerns. */
const SENSITIVE_PATHS = [
  '.ssh',
  'id_rsa',
  'id_ed25519',
  'known_hosts',
  '.npmrc',
  '.yarnrc',
  '.gitconfig',
  '.git-credentials',
  '.netrc',
  '.aws/credentials',
  '.docker/config.json',
  '.kube/config',
  '.gnupg',
  'authorized_keys',
  '.bash_history',
  '.zsh_history',
  'passwd',
  'shadow',
  '/etc/hosts',
];

export class FilesystemDetector implements IDetector {
  readonly name = 'filesystem';
  readonly description = 'Detects filesystem access to sensitive files and directories';

  getVisitors(ctx: DetectorContext): Record<string, (...args: unknown[]) => void> {
    return {
      // Detect require('fs') / require('fs/promises')
      CallExpression(path: { node: { callee: { name?: string }; arguments: Array<{ value?: string }> } }) {
        const node = path.node;
        if (
          node.callee.name === 'require' &&
          (node.arguments[0]?.value === 'fs' ||
            node.arguments[0]?.value === 'fs/promises' ||
            node.arguments[0]?.value === 'node:fs' ||
            node.arguments[0]?.value === 'node:fs/promises')
        ) {
          ctx.report({
            detector: 'filesystem',
            type: 'fs-module-import',
            severity: 'low',
            description: `Imports filesystem module: ${node.arguments[0].value}`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },

      // Detect references to sensitive file paths
      StringLiteral(path: { node: { value: string; loc?: { start: { line: number; column: number } } } }) {
        const value = path.node.value;
        for (const sensitivePath of SENSITIVE_PATHS) {
          if (value.includes(sensitivePath)) {
            ctx.report({
              detector: 'filesystem',
              type: 'sensitive-file-access',
              severity: 'high',
              description: `References sensitive path: "${value}" (matches: ${sensitivePath})`,
              location: path.node.loc?.start,
            });
            break;
          }
        }
      },

      // Detect homedir resolution (often used to find credential files)
      MemberExpression(path: { node: { object: { name?: string }; property: { name?: string } } }) {
        const node = path.node;
        if (
          node.object.name === 'os' &&
          node.property.name === 'homedir'
        ) {
          ctx.report({
            detector: 'filesystem',
            type: 'homedir-access',
            severity: 'low',
            description: 'Resolves user home directory (os.homedir)',
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },
    };
  }
}
