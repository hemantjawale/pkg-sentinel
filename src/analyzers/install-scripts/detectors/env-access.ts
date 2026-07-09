/**
 * AST detector: Environment variable access.
 * Detects process.env reads, .env file reads, and dotenv usage.
 */

import type { IDetector, DetectorContext } from '../../interfaces.js';

export class EnvAccessDetector implements IDetector {
  readonly name = 'env-access';
  readonly description = 'Detects access to environment variables and .env files';

  getVisitors(ctx: DetectorContext): Record<string, (...args: unknown[]) => void> {
    return {
      // Detect process.env access
      MemberExpression(path: { node: { object: { type: string; object?: { name?: string }; name?: string }; property: { name?: string; value?: string } } }) {
        const node = path.node;

        // process.env
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object?.name === 'process' &&
          node.object.property?.name === 'env'
        ) {
          ctx.report({
            detector: 'env-access',
            type: 'process-env-read',
            severity: 'medium',
            description: `Reads environment variable: process.env.${node.property.name ?? node.property.value ?? '?'}`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // Direct process.env reference
        if (
          node.object.name === 'process' &&
          node.property.name === 'env'
        ) {
          ctx.report({
            detector: 'env-access',
            type: 'process-env-access',
            severity: 'medium',
            description: 'Accesses process.env object',
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },

      // Detect require('dotenv') or import 'dotenv'
      CallExpression(path: { node: { callee: { name?: string }; arguments: Array<{ value?: string }> } }) {
        const node = path.node;
        if (
          node.callee.name === 'require' &&
          node.arguments[0]?.value === 'dotenv'
        ) {
          ctx.report({
            detector: 'env-access',
            type: 'dotenv-usage',
            severity: 'medium',
            description: 'Uses dotenv to load .env file',
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },

      // Detect fs.readFileSync('.env')
      StringLiteral(path: { node: { value: string; loc?: { start: { line: number; column: number } } } }) {
        const value = path.node.value;
        if (value.includes('.env') && !value.includes('node_modules')) {
          ctx.report({
            detector: 'env-access',
            type: 'env-file-reference',
            severity: 'medium',
            description: `References .env file: "${value}"`,
            location: path.node.loc?.start,
          });
        }
      },
    };
  }
}
