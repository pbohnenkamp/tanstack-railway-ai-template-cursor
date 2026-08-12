# Testing strategy

This template uses a **unit-majority** pyramid. Integration and e2e prove seams that
unit tests cannot; they are not the default TDD surface. See
[ADR-0006](./adr/0006-testing-strategy.md).

## Layers

| Layer | Command | What it covers |
| --- | --- | --- |
| Unit | `pnpm test` / `pnpm test:watch` | Zod schemas, `*.domain.ts`, `authed`, pure helpers |
| Integration | `pnpm test:integration` | Handlers ↔ real Postgres (`app_test`) |
| Storybook | `pnpm test:storybook` | Component render, interaction, a11y |
| E2E | `pnpm test:e2e` | Multi-step journeys in a real browser |
| Smoke | `pnpm test:smoke` | Read-only checks against a deployed `APP_URL` |

`pnpm test:all` runs unit, integration, storybook, then e2e.

## Day-to-day workflow

1. **Logic TDD:** `pnpm test:watch` — no database.
2. **SQL / handlers:** `pnpm db:up` once, then `pnpm test:integration` or
   `pnpm test:integration:watch` against **`app_test`** (never `app`).
3. **Manual exploration:** `pnpm db:up` + `pnpm db:setup` + `pnpm dev` against
   **`app`** — isolated from integration truncates.
4. **UI primitives:** Storybook; see [`storybook-workflow.md`](./storybook-workflow.md).
5. **Critical journeys:** `pnpm test:e2e` (starts the app via Playwright `webServer`
   when needed; expects Compose Postgres with `app` migrated).

## Databases

| Database | Purpose |
| --- | --- |
| `app` (Compose, port 5434) | Manual / `pnpm dev` / e2e against the running app |
| `app_test` (same Compose server) | Integration tests only |
| GHA Postgres service | CI integration (ephemeral job DB) |

Integration global setup creates `app_test` if missing, migrates it, and **refuses**
to run if `DATABASE_URL` points at database `app`.

Local default integration URL:

```text
postgresql://postgres:postgres@127.0.0.1:5434/app_test
```

Override with `DATABASE_URL` only when it still targets a dedicated test database
(CI sets this to the service container).

## File layout (tests as feature docs)

```text
src/lib/**/*.test.ts                 # unit — colocated with source
tests/integration/features/<name>/   # SQL proof + feature README
tests/e2e/features/<name>/           # Playwright journeys + feature README
tests/smoke/                         # post-deploy read-only checks
tests/*/support/                     # harnesses, fixtures, factories
```

Name feature folders after the product language (`todos`, later `billing`), not
technical layers. Each feature README lists the scenarios the tests encode.

## Style: Given / When / Then without Gherkin

Use nested `describe` / `it` and short comments — no `.feature` files, Cucumber, or
playwright-bdd:

```ts
describe('create todo', () => {
  it('persists a title', async () => {
    // Given an empty todos table
    // When insertTodo is called with a valid title
    // Then listTodos returns that row
  })
})
```

## What to unit-test vs integrate

| Prefer unit | Prefer integration |
| --- | --- |
| Zod schemas | Handler queries and inserts |
| Pure `*.domain.ts` rules | Constraints, cascades, transactions |
| `authed` with mocked Clerk | Row scope against a real DB |
| Sorting / filtering helpers | Migration-applied schema shape |

Do **not** mock Postgres in unit tests to “cover” SQL. Call plain handlers from
integration tests (ADR-0005) — not `createServerFn` wiring.

When handler logic grows beyond orchestration, extract pure functions into
`*.domain.ts` and cover them with unit tests so integration stays thin.

## CI

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs lint, typecheck, build,
unit, Storybook, integration (Postgres 17 service), e2e, and CodeQL. The aggregator
job **`CI`** is the status check to require on `main`.

After each deploy, [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
runs read-only smoke tests (`pnpm test:smoke`) against the environment `APP_URL`.
See [`docs/ci-cd.md`](./ci-cd.md) and [ADR-0007](./adr/0007-ci-cd-trunk-based.md).
