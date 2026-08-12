# 0007. Trunk-based CI/CD with GitHub Actions and Railway

- **Status:** Accepted
- **Date:** 2026-08-12
- **Deciders:** Phillip Bohnenkamp

## Context and Problem Statement

The template needs a predictable release path: short-lived feature branches, required
quality gates before merge, three hosted environments (dev / stage / production), and
post-deploy verification — without inventing a second host or a long-lived release
branch model.

## Decision Drivers

- Trunk-based development with PR gates on `main`.
- One required status check that rolls up lint, types, build, tests, and SAST.
- Railway remains the deploy target (Nitro + [`railway.toml`](../../railway.toml)).
- Manual promotion through stage and production; automatic deploy of `main` to `dev`.
- Feature branches may optionally overwrite shared `dev` after CI is green.
- Smoke tests hit the real environment URL and stay read-only.

## Considered Options

1. **GitFlow / release branches** with auto-deploy of every environment.
2. **Trunk-based** with GitHub Actions CI, GitHub Environments, Railway CLI deploys,
   CodeQL, and post-deploy Playwright smoke.
3. **Ephemeral per-PR Railway environments** instead of a shared `dev`.

## Decision Outcome

**Chosen: option 2.**

| Concern | Choice                                                                               |
| ------- | ------------------------------------------------------------------------------------ |
| Git     | Feature branches → PR → `main`                                                       |
| CI      | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) aggregator job `CI`     |
| SAST    | GitHub CodeQL (`javascript-typescript`)                                              |
| Deploy  | [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) + Railway CLI   |
| Envs    | Railway environments `dev` / `stage` / `production`, mirrored as GitHub Environments |
| Promote | `main`→`dev` automatic; `stage` and `production` manual with prior-env SHA checks    |
| Smoke   | [`tests/smoke/`](../../tests/smoke/) via `pnpm test:smoke` (no writes)               |

Shared `dev` is overwritten by feature-branch deploys (one active preview). Ephemeral
preview environments are out of scope for this template.

### Consequences

- Template consumers must configure GitHub branch protection, Environments, and Railway
  secrets (see [`TEMPLATE_CHECKLIST.md`](../../TEMPLATE_CHECKLIST.md) §7 and
  [`docs/ci-cd.md`](../ci-cd.md)).
- Mutating e2e scenarios stay in local/CI Playwright against ephemeral Postgres — not
  against shared hosted environments.
- Progression to production requires a successful GitHub Deployment record for the same
  SHA on `stage` (and `stage` requires `dev`).

## More Information

- [`docs/ci-cd.md`](../ci-cd.md)
- [ADR-0003](0003-schema-source-of-truth-and-migrations.md), [ADR-0006](0006-testing-strategy.md)
