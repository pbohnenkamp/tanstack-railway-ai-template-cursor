import { auth } from '@clerk/tanstack-react-start/server'

import { isClerkServerConfigured } from '#/integrations/clerk/config'

/**
 * The authentication half of the ADR-0002 boundary, in one place.
 *
 * `authed` resolves the Clerk session, rejects an anonymous caller, and hands
 * the handler a `userId` that is non-null by construction. A handler cannot run
 * without one, so the "did someone forget the auth check?" failure mode is a
 * type error instead of a silent data leak.
 *
 * Authorization — the row-level `eq(table.userId, userId)` predicate — stays in
 * each query, because it is per-table and per-statement and no wrapper can
 * express it. `authed` deliberately does not imply it. See docs/adr/0002.
 *
 * When Clerk is not configured (template bypass), callers are rejected the same
 * way as anonymous sessions — protected data access requires real keys.
 *
 * The wrapped result is a plain async function: `createServerFn().handler()`
 * accepts it, and tests can call it directly without the Start server runtime.
 */
export function authed<TData, TResult>(
  handler: (ctx: { data: TData; userId: string }) => Promise<TResult>,
): (ctx: { data: TData }) => Promise<TResult> {
  return async ({ data }) => {
    if (!isClerkServerConfigured()) {
      throw new Error('Unauthorized')
    }

    const { userId } = await auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    return await handler({ data, userId })
  }
}
