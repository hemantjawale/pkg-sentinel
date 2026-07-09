import { describe, it, expect } from 'vitest';
import { SupplyChainAnalyzer } from '../../../src/analyzers/supply-chain/supply-chain-analyzer.js';
import { AnalysisContext } from '../../../src/core/context.js';
import type { NpmPackageMetadata } from '../../../src/providers/npm/types.js';

describe('SupplyChainAnalyzer', () => {
  it('correctly tracks supply chain changes and provenance', async () => {
    const analyzer = new SupplyChainAnalyzer();
    const context = new AnalysisContext('chalk');

    context.npmMetadata = {
      name: 'chalk',
      'dist-tags': { latest: '5.3.0' },
      versions: {
        '5.2.0': {
          name: 'chalk',
          version: '5.2.0',
          dist: { shasum: '123', tarball: '', unpackedSize: 10000 },
          dependencies: { lodash: '4.17.21' },
          _npmUser: { username: 'sindresorhus' },
          maintainers: [{ username: 'sindresorhus' }],
        },
        '5.3.0': {
          name: 'chalk',
          version: '5.3.0',
          dist: {
            shasum: '456',
            tarball: '',
            unpackedSize: 25000, // Size increased by 150%
            attestations: { provenance: { predicateType: 'slsa' } },
            integrity: 'sha512-xyz',
          },
          dependencies: { lodash: '4.17.21', typescript: '5.0.0' }, // Added typescript
          _npmUser: { username: 'transferred-user' }, // Publisher change!
          maintainers: [{ username: 'sindresorhus' }, { username: 'attacker' }], // Maintainer added!
        },
      },
      time: {
        created: '2014-03-09T03:36:11.838Z',
        modified: '2024-03-09T03:36:11.838Z',
        '5.2.0': '2023-03-09T03:36:11.838Z',
        '5.3.0': '2024-03-09T03:36:11.838Z',
      },
    } as unknown as NpmPackageMetadata;

    const result = await analyzer.analyze(context);

    expect(result.analyzer).toBe('supply-chain');
    expect(result.status).toBe('completed');

    const metrics = result.metadata['metrics'] as Record<string, any>;
    expect(metrics['hasProvenance']).toBe(true);
    expect(metrics['integrityHash']).toBe('sha512-xyz');

    // Maintainer additions
    expect(metrics['maintainerChanges']).toHaveLength(1);
    expect(metrics['maintainerChanges'][0].type).toBe('added');
    expect(metrics['maintainerChanges'][0].username).toBe('attacker');

    // Publisher change
    expect(metrics['publisherChanges']).toHaveLength(1);
    expect(metrics['publisherChanges'][0].previousPublisher).toBe('sindresorhus');
    expect(metrics['publisherChanges'][0].newPublisher).toBe('transferred-user');

    // Dependencies
    expect(metrics['dependencyAdditions']).toHaveLength(2);
    expect(metrics['dependencyAdditions'].some((d: any) => d.name === 'typescript')).toBe(true);

    // Size
    expect(metrics['packageSizeBytes']).toBe(25000);
    expect(metrics['previousPackageSizeBytes']).toBe(10000);
  });
});
