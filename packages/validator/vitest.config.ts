import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'validator',
    setupFiles: ['./test-setup.ts'],
  },
});
