import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'cli',
    testTimeout: 30_000,
  },
});
