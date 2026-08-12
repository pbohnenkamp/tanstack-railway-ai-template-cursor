import { defineConfig } from 'vitest/config'

import { resolveIntegrationDatabaseUrl } from './tests/integration/support/databaseUrl.ts'

const databaseUrl = resolveIntegrationDatabaseUrl()

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    name: 'integration',
    environment: 'node',
    include: ['tests/integration/features/**/*.test.ts'],
    globalSetup: ['./tests/integration/support/globalSetup.ts'],
    setupFiles: ['./tests/integration/support/setup.ts'],
    // Force the worker env so `#/db` never picks up `.env.local`'s `app` URL.
    env: {
      DATABASE_URL: databaseUrl,
    },
    fileParallelism: false,
  },
})
