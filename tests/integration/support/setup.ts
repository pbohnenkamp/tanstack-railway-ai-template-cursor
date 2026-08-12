import { beforeEach } from 'vitest'

import { resetIntegrationDatabase } from './db.ts'

beforeEach(async () => {
  await resetIntegrationDatabase()
})
