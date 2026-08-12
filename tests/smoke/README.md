# Smoke tests (post-deploy)

Read-only Playwright checks run against a live environment URL after each
deploy (`pnpm test:smoke` / Deploy workflow). They must not mutate shared
`dev` / `stage` / `production` data.

See [`docs/ci-cd.md`](../../docs/ci-cd.md) and ADR-0007.
