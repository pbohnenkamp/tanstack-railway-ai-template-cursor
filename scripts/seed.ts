/**
 * Development seed data.
 *
 * Runs after migrations, never before — the schema is owned by src/db/schema.ts
 * and applied through drizzle/. `pnpm db:setup` chains the two; this script is
 * also runnable on its own with `pnpm db:seed`.
 *
 * Add inserts below and keep them idempotent: db:setup is expected to be safe
 * to re-run. See docs/adr/0003.
 */
import { config } from 'dotenv'
// import { drizzle } from 'drizzle-orm/node-postgres'
// import { todos } from '../src/db/schema.ts'

config({ path: ['.env.local', '.env'] })

const url = process.env.DATABASE_URL
if (!url) {
  console.error(
    'DATABASE_URL is not set. Copy .env.example → .env.local and run `pnpm db:up`.',
  )
  process.exit(1)
}

// Pattern: connect, then insert only when the table is empty.
//
// const db = drizzle(url, { schema: { todos } })
//
// const existing = await db.select({ id: todos.id }).from(todos).limit(1)
// if (existing.length > 0) {
//   console.log('todos already seeded, skipping')
// } else {
//   await db.insert(todos).values([{ title: 'First todo' }])
//   console.log('seeded todos')
// }

console.log('seed: nothing to insert')

process.exit(0)
