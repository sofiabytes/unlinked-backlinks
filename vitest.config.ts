import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    alias: {
      'obsidian': path.resolve(__dirname, './tests/obsidian-mock.ts')
    }
  }
});
