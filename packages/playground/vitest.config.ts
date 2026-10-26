import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'playground',
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
  },
});
