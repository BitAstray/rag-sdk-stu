import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

const pkgDir = (name: string) => resolve(__dirname, 'packages', name, 'src', 'index.ts')

const aliases = {
  '@rag-sdk/core': pkgDir('core'),
  '@rag-sdk/indexing': pkgDir('indexing'),
  '@rag-sdk/runtime': pkgDir('runtime'),
  '@rag-sdk/adapters': pkgDir('adapters'),
  '@rag-sdk/eval': pkgDir('eval'),
  '@rag-sdk/observability': pkgDir('observability'),
  '@rag-sdk/utils': pkgDir('utils'),
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
    projects: [
      {
        test: {
          name: 'unit',
          include: ['packages/**/__tests__/**/*.test.ts'],
        },
      },
      {
        resolve: { alias: aliases },
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
        },
      },
      {
        resolve: { alias: aliases },
        test: {
          name: 'smoke',
          include: ['tests/smoke/**/*.test.ts'],
        },
      },
    ],
  },
})
