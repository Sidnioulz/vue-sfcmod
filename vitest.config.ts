import { fileURLToPath } from 'url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/dist/**', '**/node_modules/**', '**/examples/**'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      include: ['index.ts', 'bin/vue-sfcmod.ts', 'src/**/*.ts'],
      exclude: [
        '**/dist/**',
        '**/node_modules/**',
        '**/__fixtures__/**',
        '**/__tests__/**',
        '**/src/types/*.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
