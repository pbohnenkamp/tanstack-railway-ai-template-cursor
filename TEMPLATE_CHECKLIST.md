# Template setup checklist

Complete this checklist when creating a **new application** from this template.
Developers and AI agents should work through every unchecked item before treating
the app as production-ready.

> While Clerk keys are missing or invalid, the dev site **bypasses authentication**
> so example pages stay navigable. A **Clerk bypass** banner appears in the UI and a
> **CRITICAL** warning is printed in the server console. Do not ship in that state.

## 1. Project bootstrap

- [ ] Copy `.env.example` → `.env.local` (never commit secrets)
- [ ] Install dependencies (`npm install`)
- [ ] Start the app (`npm run dev`) and confirm the home page loads
- [ ] Rename the package / app title in `package.json`, `README.md`, and
      `src/routes/__root.tsx` (`head.title`) to your product name

## 2. Configure Clerk (required before real auth)

- [ ] Create an application in the [Clerk dashboard](https://dashboard.clerk.com)
- [ ] Set `VITE_CLERK_PUBLISHABLE_KEY` (`pk_test_…` or `pk_live_…`) in `.env.local`
- [ ] Set `CLERK_SECRET_KEY` (`sk_test_…` or `sk_live_…`) in `.env.local`
- [ ] Restart the dev server
- [ ] Confirm the **Clerk bypass** banner is gone
- [ ] Confirm the CRITICAL Clerk console warning is gone
- [ ] Visit `/demo/clerk` and complete a sign-in / sign-out smoke test
- [ ] For production: use a dedicated production Clerk instance, production keys,
      and configure allowed domains / social connections

Keys and wiring live in:

- `.env.local` / `.env.example`
- `src/start.ts` (`clerkMiddleware` when configured)
- `src/integrations/clerk/` (provider, header user, config detection)
- `src/lib/server-auth.ts` (`authed` — required for user-owned data)
- `src/lib/session.ts` + `src/routes/_authenticated.tsx` (signed-in UX only)
- `src/routes/demo/clerk.tsx`
- `docs/adr/0002-enforce-authorization-in-server-functions.md`

## 3. Configure the database (Postgres + Drizzle)

Local Postgres runs from [`compose.yaml`](./compose.yaml) (Compose Spec). Deployed
environments set `DATABASE_URL` to Railway (or other managed) Postgres — they never
use the compose file. See [`docs/adr/0004`](./docs/adr/0004-postgres-with-drizzle.md)
and [`docs/adr/0003`](./docs/adr/0003-schema-source-of-truth-and-migrations.md).

- [ ] Ensure `.env.local` has `DATABASE_URL` matching `compose.yaml`
      (`postgresql://postgres:postgres@localhost:5434/app` by default)
- [ ] Start local Postgres: `pnpm db:up` (requires `podman` or swap to `docker compose`)
- [ ] Apply migrations + seed: `pnpm db:setup`
- [ ] Review `src/db/schema.ts` and adjust for your domain
- [ ] For schema changes that will ship: `pnpm db:generate`, review `drizzle/`, then
      `pnpm db:migrate` — commit schema + migrations together (ADR-0003)
- [ ] Smoke-test `/demo/drizzle` or your first data route
- [ ] For Railway: provision Postgres, set `DATABASE_URL` on the app service,
      confirm `railway.toml` `preDeployCommand` runs `pnpm db:migrate`

Scripts: `db:up` / `db:down` / `db:reset` / `db:setup` / `db:generate` /
`db:migrate` / `db:seed` / `db:push` / `db:studio`.

## 4. Product shell & demos

- [ ] Update branding in `src/components/Header.tsx` and `src/components/Footer.tsx`
- [ ] Rebrand colors by editing shadcn tokens in `src/styles.css` (`:root` /
      `.dark`) — do not add a parallel palette; components use utilities like
      `bg-primary` and `text-muted-foreground`
- [ ] Run `pnpm storybook` and confirm `UI/*` stories match your branded tokens
      in both light and dark (toolbar theme switch)
- [ ] Keep stories co-located next to components (`*.stories.tsx`); see
      [`docs/storybook-workflow.md`](./docs/storybook-workflow.md)
- [ ] Replace starter copy on `/` and `/about`
- [ ] Delete or replace `src/routes/demo/**` and matching `src/lib/demo/**`
      once examples are no longer needed
- [ ] Remove unused add-ons from dependencies if you are not keeping them

## 5. Testing (see [`docs/testing-strategy.md`](./docs/testing-strategy.md))

- [ ] Read ADR-0006 and run `pnpm test` (unit) / `pnpm test:watch` for local TDD
- [ ] With Compose up (`pnpm db:up`), run `pnpm test:integration` against `app_test`
      (never the long-lived `app` database)
- [ ] Run `pnpm test:storybook` (example: `UI/Button` `Clicked` / `Disabled`)
- [ ] Run `pnpm test:e2e` once Compose `app` is migrated (`pnpm db:setup`) —
      first time: `pnpm exec playwright install chromium`
- [ ] Confirm CI workflows are present (`.github/workflows/ci.yml`, `deploy.yml`) —
      full GitHub/Railway wiring is §7

## 6. Quality gates before first deploy

- [ ] `pnpm check` and `pnpm lint` pass
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm build-storybook` succeeds (optional until you gate UI separately)
- [ ] `pnpm test`, `pnpm test:integration`, and `pnpm test:storybook` pass
- [ ] Auth-protected server functions obtain `userId` from `authed`
      (`src/lib/server-auth.ts`) and constrain every query by that `userId`
      (route guards alone are not enough — see `docs/adr/0002`)
- [ ] Secrets exist only in the host environment (Railway / GitHub Environment
      deploy credentials), not in git
- [ ] Production Clerk + database URLs point at production resources

## 7. CI/CD (GitHub Actions + Railway)

See [`docs/ci-cd.md`](./docs/ci-cd.md) and [ADR-0007](./docs/adr/0007-ci-cd-trunk-based.md).
Workflows alone cannot configure GitHub or Railway — complete these before treating
hosted environments as real.

### Workflows & branch protection

- [ ] Confirm `.github/workflows/ci.yml` and `deploy.yml` exist on the default branch
- [ ] Push a branch / open a PR and confirm all CI jobs go green (aggregator **`CI`**)
- [ ] Protect `main`: require a pull request before merging
- [ ] Protect `main`: require status check **`CI`** (and prefer “up to date before
      merge”)
- [ ] Protect `main`: dismiss stale reviews on new pushes
- [ ] For production apps: disable admin bypass of branch protection

### Railway

- [ ] Create one Railway project with three environments: `dev`, `stage`,
      `production`
- [ ] Confirm the build uses **Node 22+** (`.node-version` / `engines.node` —
      Vite 8 fails on Node 18 with `styleText` missing from `node:util`)
- [ ] Provision Postgres (or attach) per environment; set `DATABASE_URL` on each
      app service environment
- [ ] Set Clerk keys (and any other app secrets) on each Railway environment —
      production uses a production Clerk instance
- [ ] Confirm [`railway.toml`](./railway.toml) `preDeployCommand` runs
      `pnpm db:migrate`
- [ ] Generate a public domain (or custom domain) per environment

### GitHub Environments

- [ ] Create GitHub Environments named `dev`, `stage`, `production`
- [ ] For each environment, set secret `RAILWAY_TOKEN` and variables
      `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID`,
      `APP_URL` (public base URL for smoke tests)
- [ ] On `stage` / `production`: enable required reviewers (optional wait timer on
      production)

### First deploys

- [ ] Merge to `main` and confirm auto-deploy to Railway `dev` + smoke pass
- [ ] Manually run **Deploy** → `stage`, then `production`, and confirm progression
      guards + smoke
- [ ] Optionally: deploy a feature branch to `dev` via `workflow_dispatch` after CI
      is green (this **overwrites** shared `dev`)

## Agent notes

When an agent starts work on a fresh clone of this template:

1. Read this file and prefer completing **Configure Clerk** early if the task
   involves signed-in users, protected routes, or account UI.
2. If Clerk is unconfigured, expect auth bypass — do not treat missing sessions
   as application bugs.
3. After adding keys, restart the Vite dev process so `import.meta.env` and
   server env pick up the change.
4. For user-owned data, follow ADR-0002: `authed` + `userId` in every query.
   Route guards are UX only. Put CRUD behind `createServerFn` with the
   wiring/handlers/schemas split (ADR-0005) — not API routes.
5. Database: `pnpm db:up` then `pnpm db:setup`. Schema lives in
   `src/db/schema.ts`; ship changes via `db:generate` + committed `drizzle/`
   (ADR-0003). Do not rely on `db:push` for shared or deployed databases.
6. Testing: unit-majority pyramid (ADR-0006). Integration uses `app_test` on
   Compose; do not point it at `app`. See `docs/testing-strategy.md`.
7. When bootstrapping a deployable app, complete **§7 CI/CD** before treating
   `dev` / `stage` / `production` as real environments.
