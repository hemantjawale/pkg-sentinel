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
        'src/cli/index.ts',
        'src/index.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
  },
});
