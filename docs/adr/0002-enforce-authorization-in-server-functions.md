# 0002. Enforce authorization in server functions, not route guards

- **Status:** Accepted
- **Date:** 2026-08-09
- **Deciders:** Phillip Bohnenkamp

## Context and Problem Statement

Protected pages live under the `_authenticated` layout route, which reads as though it is the
security boundary. It is not. [`src/routes/_authenticated.tsx`](../../src/routes/_authenticated.tsx):

```tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.userId) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
  },
  component: Outlet,
})
```

This is a genuine server-side redirect — it runs during SSR, so a signed-out visitor is sent to
sign-in rather than reaching a loader. That makes it *more* convincing to read as the boundary, and
it still is not one. It gates **route matching**, and server functions are RPC endpoints reachable
without matching a route. Anyone can `POST` to one directly, whatever the router did or did not
render. The guard also re-runs in the client's own router, where the visitor controls it.

The actual enforcement is in the data layer, via `authed` and a `userId` predicate on every query:

```ts
export const findTodo = authed(
  async ({ data, userId }: { data: { id: number }; userId: string }) =>
    await db
      .select()
      .from(todos)
      .where(and(eq(todos.id, data.id), eq(todos.userId, userId))),
)
```

Two distinct guarantees, both server-side. `authed` rejects anonymous callers, and the `userId`
predicate on every query scopes rows to the owner. A signed-in user cannot read or mutate another
user's row by guessing an ID.

The risk is that the route guard *looks* authoritative, so a contributor could reasonably add a
server function without an auth check, assuming the layout already handled it. That is what this
record exists to prevent — and why the check is a construct rather than a paragraph.

## Decision Drivers

- Authorization must hold for any caller, not just the app's own UI.
- Route-level guards cannot protect RPC endpoints reachable outside the router.
- The rule needs to be stated where it can be followed, not inferred from existing code.

## Considered Options

1. **Server-side `beforeLoad` redirect as the boundary.** Move the check into the route's
   `beforeLoad` so it runs during SSR.
2. **Authenticate every server function centrally, and scope rows centrally too.**
3. **Repeat `auth()` and the null check by hand in each server function.**
4. **Authenticate centrally; scope rows per query.**

## Decision Outcome

**Chosen: option 4 — the boundary is split by what can be centralized.**

Option 1 is worth doing and is what the guard above does — it keeps signed-out visitors off
authenticated routes without a flash or an SSR error. But it is not an answer to this question. It
cannot protect server functions, which are callable independently of route matching. It is UX.

Option 2 overreaches. Row-level scoping is per-table and per-statement — `eq(todos.userId,
userId)` cannot be hoisted into anything shared without inventing a policy layer over Drizzle.
Centralizing it in name only would leave authorization distributed while *looking* covered, which is
worse than leaving it visibly distributed.

Option 3 is the same four lines in every handler. It is boilerplate, it is omissible, and nothing
catches the omission.

So the two halves are treated differently:

**Authentication is centralized** in `authed()`
([`src/lib/server-auth.ts`](../../src/lib/server-auth.ts)). It resolves the session, rejects a null
`userId`, and passes a non-null `userId` into the handler. Handlers receive their `userId`; they
cannot fetch one themselves. Skipping the check is not something you can forget to do — there is no
code path into a handler that produces one.

**Authorization stays in the query**, in plain sight, in the same expression that fetches the data.
`authed` does not imply it and must not be read as providing it.

**The rule:**

> Every server function that touches user data MUST obtain its `userId` from `authed`, and MUST
> constrain every query by that `userId`. Route guards are user experience only and MUST NOT be
> relied on for access control.

### Consequences

**Positive**

- The boundary sits at the data layer, where it holds for every caller.
- Row-level ownership is enforced in the same expression that fetches the data, so there is no window
  where an unscoped query exists.
- The authentication half is verified once, in `src/lib/server-auth.test.ts`, and that coverage
  extends to every server function built on `authed` — including future ones.

**Negative**

- Row scoping still has to be written correctly in each query, and each resource owes its own
  isolation tests. `authed` cannot supply them.
- A handler that queries a table with no `userId` column will type-check and run. The wrapper
  guarantees a caller is *authenticated*, never that a given query is *scoped*.

## More Information

- The guard reads `context.userId`, which the root route's `beforeLoad` fills by calling
  `fetchSession` ([`src/lib/session.ts`](../../src/lib/session.ts)). That costs one server round-trip
  per navigation. It buys an SSR-correct redirect and no signed-out flash; if it ever shows up in
  navigation timings, cache it rather than moving the check back into render.
- Route context is serialized to the client. `userId` is safe to expose — it is the visitor's own id,
  which Clerk already puts in the browser — but nothing secret belongs there.
- Env var convention supports this: `VITE_`-prefixed vars are client-exposed by design
  (`VITE_CLERK_PUBLISHABLE_KEY`). `CLERK_SECRET_KEY` and `DATABASE_URL` are unprefixed and never
  reach the client bundle. Preserve this when adding variables.
- While Clerk keys are missing, this template **bypasses** auth for exploration (`template-setup`).
  `fetchSession` returns `userId: null` and `authed` rejects callers. Do not treat that as a reason
  to skip `authed` on product handlers — configure Clerk before shipping protected features.
- The `/demo/drizzle` todos demo is intentionally public (no `userId` column). It is not a model for
  product data access. Copy the `authed` + row-scope pattern when you add owned resources. The
  wiring/handlers/schemas layout for that demo (and for product resources) is
  [ADR-0005](0005-server-functions-as-data-access-layer.md).
