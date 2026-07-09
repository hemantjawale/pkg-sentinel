/**
 * AST detector: Code obfuscation.
 * Detects eval(), Function constructor, obfuscated code patterns, and high entropy strings.
 */

import type { IDetector, DetectorContext } from '../../interfaces.js';

export class ObfuscationDetector implements IDetector {
  readonly name = 'obfuscation';
  readonly description = 'Detects eval(), dynamic code execution, obfuscated code, and high-entropy strings';

  getVisitors(ctx: DetectorContext): Record<string, (...args: unknown[]) => void> {
    return {
      CallExpression(path: { node: { callee: { name?: string; type?: string; property?: { name?: string } }; arguments: Array<{ value?: string; type?: string }> } }) {
        const node = path.node;
        const callee = node.callee;

        // eval()
        if (callee.name === 'eval') {
          ctx.report({
            detector: 'obfuscation',
            type: 'eval-usage',
            severity: 'critical',
            description: 'Uses eval() for dynamic code execution',
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // Function constructor called without new
        if (callee.name === 'Function' && callee.type === 'Identifier') {
          ctx.report({
            detector: 'obfuscation',
            type: 'function-constructor',
            severity: 'critical',
            description: 'Uses Function constructor for dynamic code execution',
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // setTimeout/setInterval with string argument (dynamic eval)
        if (
          (callee.name === 'setTimeout' || callee.name === 'setInterval') &&
          node.arguments[0]?.type === 'StringLiteral'
        ) {
          ctx.report({
            detector: 'obfuscation',
            type: 'timer-eval',
            severity: 'high',
            description: `Uses ${callee.name}() with string argument (implicit eval)`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // Buffer.from + toString for encoding
        if (
          callee.property?.name === 'from' &&
          callee.type === 'MemberExpression'
        ) {
          // Check if it's Buffer.from('base64string', 'base64')
          if (
            node.arguments[1]?.value === 'base64' ||
            node.arguments[1]?.value === 'hex'
          ) {
            ctx.report({
              detector: 'obfuscation',
              type: 'encoded-data',
              severity: 'medium',
              description: `Decodes ${node.arguments[1].value}-encoded data`,
              location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
            });
          }
        }

        // atob / btoa
        if (callee.name === 'atob' || callee.name === 'btoa') {
          ctx.report({
            detector: 'obfuscation',
            type: 'base64-encoding',
            severity: 'low',
            description: `Uses ${callee.name}() for base64 encoding/decoding`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },

      NewExpression(path: { node: { callee: { name?: string; type?: string }; loc?: { start: { line: number; column: number } } } }) {
        const node = path.node;
        const callee = node.callee;
        if (callee.name === 'Function' && callee.type === 'Identifier') {
          ctx.report({
            detector: 'obfuscation',
            type: 'function-constructor',
            severity: 'critical',
            description: 'Uses Function constructor for dynamic code execution',
            location: node.loc?.start,
          });
        }
      },

      // Detect high-entropy strings (potential obfuscated payloads)
      StringLiteral(path: { node: { value: string; loc?: { start: { line: number; column: number } } } }) {
        const value = path.node.value;

        // Skip short strings and common patterns
        if (value.length < 50) return;

        // Check for hex-encoded strings
        if (/^[0-9a-fA-F]+$/.test(value) && value.length > 64) {
          ctx.report({
            detector: 'obfuscation',
            type: 'hex-encoded-string',
            severity: 'medium',
            description: `Contains long hex-encoded string (${value.length} chars)`,
            location: path.node.loc?.start,
          });
          return;
        }

        // Check for base64-encoded strings
        if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length > 100) {
          ctx.report({
            detector: 'obfuscation',
            type: 'base64-string',
            severity: 'medium',
            description: `Contains long base64-like string (${value.length} chars)`,
            location: path.node.loc?.start,
          });
          return;
        }

        // Shannon entropy check for obfuscated code
        const entropy = calculateEntropy(value);
        if (entropy > 5.5 && value.length > 100) {
          ctx.report({
            detector: 'obfuscation',
            type: 'high-entropy-string',
            severity: 'medium',
            description: `Contains high-entropy string (entropy: ${entropy.toFixed(2)}, length: ${value.length})`,
            location: path.node.loc?.start,
          });
        }
      },

      // Detect computed property access chains (typical in obfuscation)
      MemberExpression(path: { node: { computed: boolean; property: { type?: string } } }) {
        // Track heavily computed access for heuristic scoring
        if (path.node.computed && path.node.property.type === 'StringLiteral') {
          // obj["property"] — common in obfuscated code
          // Low severity on its own, but contributes to combination scoring
        }
      },
    };
  }
}

/**
 * Calculate Shannon entropy of a string.
 * Higher entropy = more randomness = potentially obfuscated.
 */
function calculateEntropy(str: string): number {
  const freq = new Map<string, number>();
  for (const char of str) {
    freq.set(char, (freq.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / str.length;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}
