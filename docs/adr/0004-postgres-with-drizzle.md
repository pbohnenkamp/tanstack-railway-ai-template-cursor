# 0004. Postgres with Drizzle ORM over the `node-postgres` driver

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Phillip Bohnenkamp

## Context and Problem Statement

The application needs a relational database, a typed query layer, and a local development story that
does not depend on an external service or an account.

Three choices are entangled and are decided together here, because picking one constrains the others:
the database engine, the driver, and how the engine is supplied in each environment.

## Decision Drivers

- Types derived from the schema, not maintained alongside it.
- SQL-shaped queries — the access patterns are CRUD with ownership predicates.
- Local development that works offline, with no account and no expiry.
- The same engine locally as in deployed environments, so behavior transfers.
- A driver compatible with a long-lived Node server (Nitro on Railway).

## Considered Options

**Engine supply, locally:** container · hosted development database · installed on the host
**ORM:** Drizzle · Prisma · raw SQL

## Decision Outcome

**Chosen: Postgres, in a container locally and a managed Postgres service in deployed environments,
accessed through Drizzle over `node-postgres`.**

A hosted development database removes the container requirement but adds an account, a network
dependency, and — for anonymous or trial tiers — an expiry clock. It also tends to sit behind a
connection pooler, so development runs through a topology that production does not, which is where
pooler-only failures such as prepared-statement errors come from. Installing Postgres on the host
gives no isolation between projects and drifts across machines.

A container gives an exact, pinned engine version that matches the deployed one, starts in seconds,
survives reboots, and is destroyed and rebuilt on demand.

Drizzle generates TypeScript types directly from [`src/db/schema.ts`](../../src/db/schema.ts), and
its query builder stays close to SQL, which suits ownership-scoped queries like:

```ts
.where(and(eq(products.id, data.id), eq(products.userId, uid)))
```

Prisma's generated client and migration engine are more machinery than this project needs; raw SQL
would give up the derived types that make [ADR-0003](0003-schema-source-of-truth-and-migrations.md)
work.

### Local database

[`compose.yaml`](../../compose.yaml) defines a single `postgres:17-alpine` service with a named
volume, a healthcheck, and a **host port of 5434** — 5432 is routinely already bound by another
project or a general-purpose local Postgres, and a template that assumes exclusivity collides on
first use.

| Command         | Effect                                                         |
| --------------- | -------------------------------------------------------------- |
| `pnpm db:up`    | Starts the container and waits for the healthcheck             |
| `pnpm db:down`  | Stops it, keeping the volume                                   |
| `pnpm db:reset` | Destroys the volume, restarts, re-applies migrations and seeds |

`pnpm db:reset` is safe and expected: local data is disposable, and rebuilding from
`drizzle/` is the fastest way to confirm the migrations actually describe the schema.

Deployed environments provide their own managed Postgres (Railway Postgres for this template) and set
`DATABASE_URL` to it. They never read `compose.yaml`.

### The driver choice is load-bearing

[`src/db/index.ts`](../../src/db/index.ts) uses `drizzle-orm/node-postgres`:

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
export const db = drizzle(process.env.DATABASE_URL!, { schema })
```

Two properties of this line tie it to the deployment target:

- `node-postgres` opens a **raw TCP connection**.
- `process.env` is read at **module scope**.

Both are correct on a long-lived Node server and both break on edge runtimes, where TCP is
unavailable and environment variables are injected per-request. **Changing the deployment target
away from Node requires changing this file first.**

Because the driver speaks plain Postgres over TCP, the same client works unchanged against the local
container and any managed Postgres. Only `DATABASE_URL` differs between environments.

### Consequences

**Positive**

- Schema types propagate everywhere without a generation step in the dev loop.
- Local development is offline-capable, free, and has no expiry.
- The local engine version matches the deployed one, and neither has a pooler in front of it, so
  connection behavior is the same in both.
- Connection pooling and long-lived connections behave normally.

**Negative**

- Requires a container runtime (`podman` or `docker`) to develop against a database.
- The `db:*` container scripts name `podman`; teams standardized on Docker must swap the binary.
- Couples the data layer to a Node runtime; an edge deployment would require a different driver and
  relocating env reads.
- Drizzle is lower-level than Prisma: no migration UI, no generated client, relations are explicit.

## More Information

- `DATABASE_URL` is unprefixed and must stay server-only. A `VITE_` prefix would publish database
  credentials to the browser bundle.
- Schema ownership and the migration workflow are specified in
  [ADR-0003](0003-schema-source-of-truth-and-migrations.md): `src/db/schema.ts` is the source of
  truth, and generated migrations in `drizzle/` are how a change reaches any database.
