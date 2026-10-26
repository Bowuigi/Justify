import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/core',
      'packages/validator',
      'packages/inferencer',
      'packages/tex-extractor',
      'packages/markdown-dsl',
      'packages/cli',
      'packages/playground',
    ],
  },
});
