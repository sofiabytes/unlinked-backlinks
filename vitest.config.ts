import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      'obsidian': './tests/obsidian-mock.ts'
    }
  }
});
