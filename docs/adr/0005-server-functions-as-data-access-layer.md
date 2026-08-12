# 0005. `createServerFn` as the data-access layer

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Phillip Bohnenkamp

## Context and Problem Statement

The app needs server-side data access: validated queries against Postgres, callable from React
components and route loaders. TanStack Start offers two mechanisms — **server functions**
(`createServerFn`) and **API routes** (route files with `server.handlers`).

## Decision Drivers

- Type safety across the client/server boundary without hand-written client code.
- Validation at the boundary, not scattered through handlers.
- One obvious place to enforce authorization (see [ADR-0002](0002-enforce-authorization-in-server-functions.md)).
- Handlers that remain callable from tests without the Start runtime.

## Considered Options

1. **API routes** — REST endpoints under `src/routes/api/`, called with `fetch`.
2. **Server functions** — `createServerFn`, invoked like ordinary async functions.

## Decision Outcome

**Chosen: server functions.**

App data access goes through `createServerFn`. Each binding is wiring only: a method, a validator,
and a handler imported from a sibling `*.handlers.ts` module.

```ts
export const updateItem = createServerFn({ method: 'POST' })
  .validator(updateItemSchema) // Zod, runs server-side before the handler
  .handler(modifyItem) // authed(), then a scoped query
```

The same order holds every time — **method → validator → auth → scoped query** — but only the first
two are expressed in the wiring file. Auth and row scope live in the handler (ADR-0002). Keeping the
handler out of the wiring file is what makes it callable from a test: a `createServerFn` result
dispatches through the Start runtime and cannot be invoked directly.

**Module layout** (per resource):

| File                             | Role                                                           |
| -------------------------------- | -------------------------------------------------------------- |
| `src/lib/<resource>.ts`          | RPC wiring — `createServerFn` + `.validator` + `.handler` only |
| `src/lib/<resource>.handlers.ts` | Plain async functions (often wrapped in `authed`)              |
| `src/lib/<resource>.schemas.ts`  | Zod input contracts (no `#/db` import)                         |

Demo resources that are intentionally replaceable live under `src/lib/demo/` with the same split —
see [`src/lib/demo/todos.ts`](../../src/lib/demo/todos.ts).

Do **not** name the wiring or handler modules `*.server.ts`. TanStack Start's import-protection
plugin blocks `.server.ts` imports from client route files, even though the handler body only ever
runs server-side. Plain `*.ts` / `*.handlers.ts` names stay importable from routes and loaders.

This template has no app API routes. Prefer adding a server function over a REST handler for
application CRUD. If a third party ever needs HTTP API access, that is a separate API-route layer,
not a change to this one.

### Consequences

**Positive**

- Return types flow to callers automatically; no client SDK, no response types to maintain, no
  `fetch` wrappers.
- `.validator(zodSchema)` makes validation structural rather than a step a handler might skip.
- Argument and return values are serialized by the framework, so the RPC boundary is invisible at
  the call site while remaining a real boundary.
- Handlers stay unit-testable without spinning up Start.

**Negative**

- Server functions are **not private**. They compile to callable RPC endpoints, reachable regardless
  of what the UI renders. Authorization must live inside them — see ADR-0002.
- No REST surface for external consumers by default.
- The call shape is unusual: arguments pass as `{ data: ... }`, e.g. `createTodo({ data: { title } })`.
  Easy to get wrong.
- A `createServerFn` result cannot be invoked outside the Start runtime. Anything that needs to be
  called directly — tests included — has to live in the handler module.

## More Information

- Authorization inside those handlers is [ADR-0002](0002-enforce-authorization-in-server-functions.md).
- Schema and migrations for the tables they query are [ADR-0003](0003-schema-source-of-truth-and-migrations.md)
  and [ADR-0004](0004-postgres-with-drizzle.md).
- Agent shorthand: [`.cursor/rules/server-functions-data-access.mdc`](../../.cursor/rules/server-functions-data-access.mdc).
- The `/demo/drizzle` todos resource is intentionally public (no `userId`). It demonstrates the
  wiring/handlers/schemas split, not owned-data auth. Product resources must still use `authed` +
  row scope.
