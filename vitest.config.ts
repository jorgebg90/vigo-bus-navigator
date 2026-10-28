import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['frontend/tests/**/*.test.ts', 'worker/unit/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['frontend/src/domain/**/*.ts', 'frontend/src/application/**/*.ts'],
      exclude: ['**/*.d.ts']
    }
  }
});
