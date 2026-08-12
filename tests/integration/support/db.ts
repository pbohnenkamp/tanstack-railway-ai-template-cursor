import { sql } from 'drizzle-orm'

import { db } from '#/db/index'

/**
 * Wipe integration tables between tests. Safe on `app_test` only — globalSetup
 * and vitest env refuse the long-lived `app` database.
 */
export async function resetIntegrationDatabase(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE todos RESTART IDENTITY CASCADE`)
}
