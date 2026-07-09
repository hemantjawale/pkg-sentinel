/**
 * AST detector: Network access.
 * Detects outbound HTTP requests, URL construction, and data exfiltration patterns.
 */

import type { IDetector, DetectorContext } from '../../interfaces.js';

/** Known data exfiltration patterns. */
const SUSPICIOUS_DOMAINS = [
  'ngrok.io',
  'requestbin.com',
  'pipedream.com',
  'webhook.site',
  'burpcollaborator.net',
  'interact.sh',
  'oastify.com',
  'canarytokens.com',
];

export class NetworkDetector implements IDetector {
  readonly name = 'network';
  readonly description = 'Detects outbound network requests and suspicious URL patterns';

  getVisitors(ctx: DetectorContext): Record<string, (...args: unknown[]) => void> {
    return {
      CallExpression(path: { node: { callee: { name?: string; object?: { name?: string }; property?: { name?: string } }; arguments: Array<{ value?: string }> } }) {
        const node = path.node;
        const callee = node.callee;

        // require('http') / require('https') / require('node-fetch') / require('axios')
        if (
          callee.name === 'require' &&
          ['http', 'https', 'http2', 'node:http', 'node:https', 'node-fetch', 'axios', 'got', 'undici'].includes(
            node.arguments[0]?.value ?? '',
          )
        ) {
          ctx.report({
            detector: 'network',
            type: 'network-module-import',
            severity: 'medium',
            description: `Imports network module: ${node.arguments[0]?.value}`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // fetch() call
        if (callee.name === 'fetch') {
          ctx.report({
            detector: 'network',
            type: 'fetch-call',
            severity: 'medium',
            description: 'Makes outbound HTTP request using fetch()',
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // XMLHttpRequest, http.request, https.request
        if (
          callee.property?.name === 'request' &&
          ['http', 'https'].includes(callee.object?.name ?? '')
        ) {
          ctx.report({
            detector: 'network',
            type: 'http-request',
            severity: 'medium',
            description: `Makes HTTP request via ${callee.object?.name}.request()`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }

        // http.get, https.get
        if (
          callee.property?.name === 'get' &&
          ['http', 'https'].includes(callee.object?.name ?? '')
        ) {
          ctx.report({
            detector: 'network',
            type: 'http-get',
            severity: 'medium',
            description: `Makes HTTP GET via ${callee.object?.name}.get()`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },

      // Detect URLs as string literals
      StringLiteral(path: { node: { value: string; loc?: { start: { line: number; column: number } } } }) {
        const value = path.node.value;

        // HTTP/HTTPS URL detection
        if (/^https?:\/\//i.test(value)) {
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
          let description = `Contains URL: ${value}`;

          // Check for suspicious domains
          for (const domain of SUSPICIOUS_DOMAINS) {
            if (value.includes(domain)) {
              severity = 'critical';
              description = `Contains suspicious exfiltration URL: ${value}`;
              break;
            }
          }

          // IP address URLs are suspicious
          if (/https?:\/\/\d+\.\d+\.\d+\.\d+/.test(value)) {
            severity = 'high';
            description = `Contains IP-based URL (potential exfiltration): ${value}`;
          }

          ctx.report({
            detector: 'network',
            type: 'url-literal',
            severity,
            description,
            location: path.node.loc?.start,
          });
        }
      },

      // Detect DNS lookups
      MemberExpression(path: { node: { object: { name?: string }; property: { name?: string } } }) {
        const node = path.node;
        if (
          node.object.name === 'dns' &&
          ['resolve', 'lookup', 'resolve4', 'resolveMx'].includes(node.property.name ?? '')
        ) {
          ctx.report({
            detector: 'network',
            type: 'dns-lookup',
            severity: 'medium',
            description: `Performs DNS lookup via dns.${node.property.name}()`,
            location: (node as unknown as { loc?: { start: { line: number; column: number } } }).loc?.start,
          });
        }
      },
    };
  }
}
