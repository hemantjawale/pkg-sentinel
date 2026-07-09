import { describe, it, expect } from 'vitest';
import { diffSnapshots } from '../../../src/snapshot/diff-engine.js';
import type { DependencySnapshot } from '../../../src/snapshot/types.js';

describe('diffSnapshots', () => {
  it('correctly calculates added, removed, and modified dependencies', () => {
    const previous: DependencySnapshot = {
      createdAt: '2024-03-01T00:00:00.000Z',
      name: 'test-project',
      dependencies: [
        {
          name: 'lodash',
          version: '4.17.21',
          maintainers: ['sindresorhus'],
          integrity: 'sha-old',
          hasInstallScripts: false,
          publisher: 'sindresorhus',
          dependencies: [],
        },
        {
          name: 'express',
          version: '4.18.2',
          maintainers: ['dougwilson'],
          integrity: 'sha-exp',
          hasInstallScripts: false,
          publisher: 'dougwilson',
          dependencies: [],
        },
      ],
      metadata: {},
    };

    const current: DependencySnapshot = {
      createdAt: '2024-03-09T00:00:00.000Z',
      name: 'test-project',
      dependencies: [
        // Lodash version upgraded, publisher changed, maintainer added
        {
          name: 'lodash',
          version: '4.18.0',
          maintainers: ['sindresorhus', 'new-maintainer'],
          integrity: 'sha-new',
          hasInstallScripts: true, // Install scripts added!
          publisher: 'attacker-user',
          dependencies: [],
        },
        // Express is missing (removed)
        // Chalk added
        {
          name: 'chalk',
          version: '5.3.0',
          maintainers: ['sindresorhus'],
          integrity: 'sha-chalk',
          hasInstallScripts: false,
          publisher: 'sindresorhus',
          dependencies: [],
        },
      ],
      metadata: {},
    };

    const diff = diffSnapshots(previous, current);

    // Added
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]?.name).toBe('chalk');

    // Removed
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]?.name).toBe('express');

    // Changed
    expect(diff.changed).toHaveLength(1);
    const change = diff.changed[0]!;
    expect(change.name).toBe('lodash');
    expect(change.changes).toContain('version: 4.17.21 → 4.18.0');
    expect(change.changes).toContain('integrity hash changed');
    expect(change.changes).toContain('publisher: sindresorhus → attacker-user');
    expect(change.changes).toContain('install scripts added');
    expect(change.changes).toContain('maintainers added: new-maintainer');
  });
});
