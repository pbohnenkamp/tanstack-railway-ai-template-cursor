import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import {
  assertNotManualAppDatabase,
  databaseNameFromUrl,
  resolveIntegrationDatabaseUrl,
  withDatabaseName,
} from './databaseUrl.ts'

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)

async function ensureDatabaseExists(targetUrl: string): Promise<void> {
  const dbName = databaseNameFromUrl(targetUrl)
  const adminUrl = withDatabaseName(targetUrl, 'postgres')
  const pool = new Pool({ connectionString: adminUrl })

  try {
    const existing = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    )
    if (existing.rowCount === 0) {
      // CREATE DATABASE cannot run inside a transaction.
      await pool.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`)
    }
  } finally {
    await pool.end()
  }
}

async function migrateDatabase(targetUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: targetUrl })
  try {
    const db = drizzle(pool)
    await migrate(db, { migrationsFolder: path.join(root, 'drizzle') })
  } finally {
    await pool.end()
  }
}

export default async function globalSetup(): Promise<void> {
  const databaseUrl = resolveIntegrationDatabaseUrl()
  assertNotManualAppDatabase(databaseUrl)

  // Workers read DATABASE_URL from vitest config `env`; keep process.env aligned
  // for anything that runs inside this globalSetup process.
  process.env.DATABASE_URL = databaseUrl

  try {
    await ensureDatabaseExists(databaseUrl)
    await migrateDatabase(databaseUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Integration globalSetup failed for ${databaseUrl}. ` +
        `Is Compose Postgres up (\`pnpm db:up\`)? ${message}`,
      { cause: error },
    )
  }
}
