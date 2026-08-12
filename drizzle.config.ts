import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: ['.env.local', '.env'] })

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // Required by db:migrate / db:push. db:generate diffs the schema against
    // drizzle/ and works offline, so an empty string is fine there.
    url: process.env.DATABASE_URL ?? '',
  },
})
