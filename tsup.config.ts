import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    target: 'node18',
    outDir: 'dist',
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    banner: {
      js: '#!/usr/bin/env node',
    },
    clean: false,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    target: 'node18',
    outDir: 'dist',
  },
]);
