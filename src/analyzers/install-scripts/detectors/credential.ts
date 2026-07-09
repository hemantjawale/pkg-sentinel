/**
 * AST detector: Credential access.
 * Detects access to SSH keys, npm tokens, git credentials, and browser storage.
 */

import type { IDetector, DetectorContext } from '../../interfaces.js';

/** Patterns that indicate credential access. */
const CREDENTIAL_PATTERNS = [
  { pattern: 'NPM_TOKEN', type: 'npm-token', severity: 'critical' as const },
  { pattern: 'npm_token', type: 'npm-token', severity: 'critical' as const },
  { pattern: 'NODE_AUTH_TOKEN', type: 'npm-token', severity: 'critical' as const },
  { pattern: 'GITHUB_TOKEN', type: 'github-token', severity: 'critical' as const },
  { pattern: 'GH_TOKEN', type: 'github-token', severity: 'critical' as const },
  { pattern: 'AWS_ACCESS_KEY', type: 'aws-key', severity: 'critical' as const },
  { pattern: 'AWS_SECRET_ACCESS_KEY', type: 'aws-secret', severity: 'critical' as const },
  { pattern: 'DOCKER_PASSWORD', type: 'docker-cred', severity: 'critical' as const },
  { pattern: 'SLACK_TOKEN', type: 'slack-token', severity: 'high' as const },
  { pattern: 'DISCORD_TOKEN', type: 'discord-token', severity: 'high' as const },
  { pattern: 'API_KEY', type: 'api-key', severity: 'high' as const },
  { pattern: 'api_key', type: 'api-key', severity: 'high' as const },
  { pattern: 'SECRET_KEY', type: 'secret-key', severity: 'high' as const },
  { pattern: 'PRIVATE_KEY', type: 'private-key', severity: 'high' as const },
  { pattern: 'PASSWORD', type: 'password', severity: 'high' as const },
  { pattern: 'REGISTRY_TOKEN', type: 'registry-token', severity: 'critical' as const },
];

export class CredentialDetector implements IDetector {
  readonly name = 'credential';
  readonly description = 'Detects access to SSH keys, API tokens, npm credentials, and secrets';

  getVisitors(ctx: DetectorContext): Record<string, (...args: unknown[]) => void> {
    return {
      // Detect credential-like environment variable names
      MemberExpression(path: { node: { object: { type: string; object?: { name?: string }; property?: { name?: string } }; property: { name?: string; value?: string } } }) {
        const node = path.node;

        // process.env.NPM_TOKEN etc.
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object?.name === 'process' &&
          node.object.property?.name === 'env'
        ) {
          const envVar = node.property.name ?? node.property.value ?? '';
          for (const cred of CREDENTIAL_PATTERNS) {
            if (envVar.includes(cred.pattern)) {
              ctx.report({
                detector: 'credential',
                type: cred.type,
                severity: cred.severity,
                description: `Reads credential from environment: process.env.${envVar}`,
                location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
              });
              break;
            }
          }
        }
      },

      // Detect SSH key and credential file references
      StringLiteral(path: { node: { value: string; loc?: { start: { line: number; column: number } } } }) {
        const value = path.node.value;

        // SSH key files
        if (
          value.includes('id_rsa') ||
          value.includes('id_ed25519') ||
          value.includes('id_ecdsa') ||
          value.includes('.ssh/') ||
          value.includes('authorized_keys')
        ) {
          ctx.report({
            detector: 'credential',
            type: 'ssh-key-access',
            severity: 'critical',
            description: `References SSH key file: "${value}"`,
            location: path.node.loc?.start,
          });
        }

        // npm credentials
        if (value.includes('.npmrc') || value.includes('npm-token')) {
          ctx.report({
            detector: 'credential',
            type: 'npmrc-access',
            severity: 'critical',
            description: `References npm credential file: "${value}"`,
            location: path.node.loc?.start,
          });
        }

        // Git credentials
        if (value.includes('.git-credentials') || value.includes('.gitconfig')) {
          ctx.report({
            detector: 'credential',
            type: 'git-credential-access',
            severity: 'high',
            description: `References git credential file: "${value}"`,
            location: path.node.loc?.start,
          });
        }

        // Browser storage paths
        if (
          value.includes('Chrome') && (value.includes('Login Data') || value.includes('Cookies')) ||
          value.includes('Firefox') && value.includes('logins.json')
        ) {
          ctx.report({
            detector: 'credential',
            type: 'browser-credential-access',
            severity: 'critical',
            description: `References browser credential storage: "${value}"`,
            location: path.node.loc?.start,
          });
        }
      },
    };
  }
}
