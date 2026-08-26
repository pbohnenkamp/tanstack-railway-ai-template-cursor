import { defineRailway, postgres, project, service } from 'railway/iac'

/**
 * Railway Infrastructure as Code (replaces railway.toml).
 * Evaluated by the Railway CLI, not the app: `railway config plan` / `apply`.
 * Omit a resource and apply means delete it — see .railway/README.md.
 */
export default defineRailway((ctx) => {
  const db = postgres('postgres')

  const web = service('web', {
    build: 'pnpm run build',
    start: 'pnpm run start',
    // Applies pending Drizzle migrations before the new container serves.
    // Schema is owned by src/db/schema.ts; see docs/adr/0003.
    preDeploy: 'pnpm db:migrate',
    healthcheck: '/',
    healthcheckTimeout: 300,
    deploy: {
      restartPolicyType: 'ON_FAILURE',
      restartPolicyMaxRetries: 10,
    },
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
    },
  })

  return project(ctx.projectName || 'app', {
    resources: [db, web],
  })
})
