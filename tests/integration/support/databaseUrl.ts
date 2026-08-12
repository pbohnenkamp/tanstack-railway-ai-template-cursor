/**
 * Resolve the Postgres URL used by integration tests.
 * Never returns a URL whose database name is the long-lived manual DB `app`.
 */
export function databaseNameFromUrl(connectionString: string): string {
  const pathname = new URL(connectionString).pathname
  return pathname.replace(/^\//, '').split('/')[0] ?? ''
}

export function withDatabaseName(
  connectionString: string,
  databaseName: string,
): string {
  const url = new URL(connectionString)
  url.pathname = `/${databaseName}`
  return url.toString()
}

export function assertNotManualAppDatabase(connectionString: string): void {
  const name = databaseNameFromUrl(connectionString)
  if (name === 'app') {
    throw new Error(
      `Integration tests must not use database "app" (got ${connectionString}). ` +
        `Use "app_test" on Compose, or a CI service database. See docs/testing-strategy.md.`,
    )
  }
}

/**
 * Prefer INTEGRATION_DATABASE_URL; otherwise DATABASE_URL rewritten off `app`;
 * otherwise the local Compose default for app_test.
 */
export function resolveIntegrationDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const explicit = env.INTEGRATION_DATABASE_URL
  if (explicit) {
    assertNotManualAppDatabase(explicit)
    return explicit
  }

  const fromEnv = env.DATABASE_URL
  if (fromEnv) {
    if (databaseNameFromUrl(fromEnv) === 'app') {
      return withDatabaseName(fromEnv, 'app_test')
    }
    assertNotManualAppDatabase(fromEnv)
    return fromEnv
  }

  return 'postgresql://postgres:postgres@127.0.0.1:5434/app_test'
}
