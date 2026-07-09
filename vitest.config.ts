import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/cli/**',
        'src/ai/**',
        'src/config/**',
        'src/reporters/**',
        'src/plugins/**',
        'src/index.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
  },
});
