# 0003. Drizzle schema as the source of truth; generated migrations for deploys

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Phillip Bohnenkamp

## Context and Problem Statement

The application stores its data in Postgres ([ADR-0004](0004-postgres-with-drizzle.md)). Three
things follow from that and need a single answer:

- **What defines the schema.** Tables can be described in SQL, in Drizzle's TypeScript builders, or
  in both. Describing them twice means they will eventually disagree, and nothing will notice.
- **How the application's types stay true.** Every query compiles against types that claim to
  describe real columns.
- **How a change reaches a deployed database.** A schema edit that only ever ran on a developer's
  machine is not a deployment strategy.

## Decision Drivers

- Exactly one artifact should define the schema.
- Types should be derived from that artifact, never maintained alongside it.
- Changes to a shared database must be reviewable, ordered, and repeatable.
- Local iteration should stay fast, and rebuilding a local database from nothing should be routine.

## Considered Options

1. **`db:push` everywhere.** Drizzle diffs the schema against the database and applies the
   difference. No migration files.
2. **Hand-written SQL as the source of truth**, with Drizzle used only to type queries.
3. **Drizzle schema as the source of truth; generated migrations for anything shared.**

## Decision Outcome

**Chosen: option 3.**

Option 1 is fine for a disposable dev database and unacceptable for a deployed one: it computes and
applies a diff with no reviewable artifact and no ordering guarantee, and it will drop columns to
reach the target state. Option 2 inverts the dependency — the types the entire application relies on
become a hand-maintained mirror of SQL, which is the duplication this decision exists to avoid.

**The rule:**

> [`src/db/schema.ts`](../../src/db/schema.ts) is the single source of truth for the database schema.
>
> - Local iteration MAY use `pnpm db:push` against a disposable dev database.
> - Any change reaching a shared or deployed database MUST go through `pnpm db:generate`, with the
>   generated files in `drizzle/` committed and reviewed, and applied with `pnpm db:migrate`.
> - No other artifact may contain DDL. There is no second schema file, and no hand-written
>   `CREATE TABLE` anywhere in the repository.

**Column types prefer `text` over `varchar(n)`.** In Postgres the two are the same type internally
with identical performance; `varchar(n)` only adds a length ceiling. Add one when the domain actually
has a limit, not by default.

## Where database artifacts live

| Path | Contents |
|---|---|
| [`src/db/schema.ts`](../../src/db/schema.ts) | Table definitions. The source of truth. Types are inferred from here. |
| [`drizzle/`](../../drizzle/) | Generated migration SQL. Committed and reviewed; never edited by hand. |
| `drizzle/meta/` | Drizzle's snapshots and journal. Generated; committed; how the next diff is computed. |
| [`drizzle.config.ts`](../../drizzle.config.ts) | Points drizzle-kit at the schema, the output directory, and `DATABASE_URL`. |
| [`scripts/seed.ts`](../../scripts/seed.ts) | Development seed data, typed against the schema. |
| [`src/db/index.ts`](../../src/db/index.ts) | The Drizzle client the application imports. |

Applied migrations are tracked by Drizzle in a `drizzle.__drizzle_migrations` table inside the
database itself, which is what makes `db:migrate` safe to re-run.

## Workflow

**Changing the schema**

1. Edit `src/db/schema.ts`.
2. `pnpm db:generate` — writes a new numbered migration into `drizzle/`. Read it. It is the artifact
   the reviewer sees, and it is the only place a destructive change is visible before it runs.
3. `pnpm db:migrate` to apply it locally.
4. Commit `src/db/schema.ts` and `drizzle/` **together**. They are one change.

Iterating on a design against a disposable database may use `pnpm db:push` and skip the migration
until the shape settles. Nothing shared may be reached that way.

**Starting from a fresh database**

1. `pnpm db:up` — starts the local Postgres container ([ADR-0004](0004-postgres-with-drizzle.md)).
2. `pnpm db:setup` — applies all migrations, then seeds.

`pnpm db:reset` does both against an empty volume, which is the fastest way to confirm that
`drizzle/` alone can produce the current schema.

**Deploying**

[`railway.toml`](../../railway.toml) runs `pnpm db:migrate` as its `preDeployCommand`, so pending
migrations are applied before the new container starts serving. A failed migration fails the release
rather than starting an application against a schema it does not match. Higher environments set
`DATABASE_URL` to the Railway (or other managed) Postgres service — they never use `compose.yaml`.

## Why seed data is not part of database startup

Postgres images run any SQL they find in an init directory the first time a data volume is created,
and hosted provisioning tools offer an equivalent seed hook. Either looks like the natural home for
seed data. Neither is: those hooks run when the database is created, **before** any migration could
have been applied, so a seed placed there can only work against tables it creates itself — a second
schema definition, and the exact duplication this ADR forbids.

Seed data therefore lives in [`scripts/seed.ts`](../../scripts/seed.ts), runs after migrations via
`pnpm db:setup`, and is written against the Drizzle schema, so it is typechecked and cannot drift
from the tables it populates. Keep it idempotent — `db:setup` is expected to be safe to re-run.

### Consequences

**Positive**

- One definition of the schema, and drift is detectable: if `db:generate` produces a file, something
  changed.
- Schema changes arrive as reviewable SQL diffs in pull requests.
- Deploys apply pending migrations automatically; no manual step, no forgotten migration.
- Seed data is typechecked against the schema rather than being raw SQL that silently rots.

**Negative**

- More ceremony than `db:push` for every change.
- Setting up a fresh database is two commands rather than one, because starting the engine and
  migrating it cannot happen in the same pass.
- `preDeployCommand` runs on every deploy and can fail the release. Intended, but it means a broken
  migration blocks shipping anything else.

## More Information

- `dotenv` is a runtime dependency, not a dev dependency: `drizzle.config.ts` imports it and runs as
  part of the deploy step.
- `DATABASE_URL` is unprefixed and must stay server-only; Vite loads it from `.env.local` for local
  `pnpm dev`.
- Local database state is disposable by design — `pnpm db:reset` rebuilds it. That is an argument for
  `db:push` while iterating locally, not against migrations generally.
