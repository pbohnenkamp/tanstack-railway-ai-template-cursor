# 0006. Testing strategy — unit-majority, Compose `app_test`, GHA Postgres

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Phillip Bohnenkamp

## Context and Problem Statement

The template needs a predictable testing pyramid: fast local TDD for domain logic,
real-Postgres proof for queries/transactions, component coverage via Storybook, and
thin end-to-end journeys — without Testcontainers overhead or a formal Gherkin DSL.

Integration tests must not share data with the long-lived local `app` database used
for manual exploration (`pnpm db:up` + `pnpm dev`).

## Decision Drivers

- Millisecond red-green for schemas, pure domain, and `authed` (ADR-0002 / ADR-0005).
- Real SQL and transaction feedback locally, without waiting for CI.
- Isolation between automated test data and manual/seed data.
- Same hermetic Postgres story in CI without introducing Testcontainers.
- Tests as feature documentation (folders + READMEs), not a second product language.

## Considered Options

1. **Integration-majority** with Testcontainers for every SQL-adjacent change.
2. **Unit-majority** with Compose `app_test` locally and a GitHub Actions Postgres
   service in CI.
3. **Unit-majority** with Testcontainers for both local and CI.

## Decision Outcome

**Chosen: option 2 — unit-majority; Compose database `app_test` locally; GHA Postgres
service in CI; no Testcontainers; no Gherkin/playwright-bdd.**

| Layer | Runner | Database |
| --- | --- | --- |
| Unit | Vitest (`vitest.unit.config.ts`) | None |
| Integration | Vitest (`vitest.integration.config.ts`) | Local: Compose `app_test`; CI: GHA service |
| Component | Storybook + Vitest browser | None |
| E2E | Playwright | Compose `app` (running app) |
| Smoke (post-deploy) | Playwright (`playwright.smoke.config.ts`) | Live `APP_URL` — read-only only |

Handlers under `*.handlers.ts` are the integration entry point (ADR-0005) — never
invoke `createServerFn` outside the Start runtime. Growing business rules move into
pure `*.domain.ts` modules so the unit layer stays the majority.

Informal Given/When/Then comments inside `describe` / `it` document scenarios. Formal
`.feature` files and playwright-bdd are out of scope.

Post-deploy smoke (`tests/smoke/`) verifies a hosted environment after Railway
deploy (ADR-0007). It is not a substitute for local e2e and must not mutate shared
stage/production data.

### Consequences

- Developers run `pnpm db:up` once, then `pnpm test:integration` against `app_test`.
- Default `DATABASE_URL` for `pnpm dev` stays on `app`; integration config must not
  target `app`.
- CI starts Postgres as a workflow service; no Compose required in Actions.
- Testcontainers remains available as a future option if hermetic local spin-up is
  needed later; it is not part of this template’s default path.

## More Information

- [`docs/testing-strategy.md`](../testing-strategy.md)
- [`docs/ci-cd.md`](../ci-cd.md), [ADR-0007](0007-ci-cd-trunk-based.md)
- [ADR-0004](0004-postgres-with-drizzle.md), [ADR-0005](0005-server-functions-as-data-access-layer.md)
