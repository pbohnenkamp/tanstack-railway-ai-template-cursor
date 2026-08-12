import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'

import { isClerkServerConfigured } from '#/integrations/clerk/config'

/**
 * Resolves the Clerk session for the router context. The root route's
 * `beforeLoad` calls this so that `context.userId` is populated during SSR,
 * which is what lets `_authenticated` redirect a signed-out visitor before any
 * component renders.
 *
 * This is navigation plumbing, not the security boundary. Route context is
 * client-visible and route matching is not an access check — server functions
 * authorize themselves through `authed`. See docs/adr/0002.
 *
 * When Clerk is bypassed (keys missing), returns `{ userId: null }` without
 * calling `auth()`, which would throw without `clerkMiddleware`.
 */
export const fetchSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    if (!isClerkServerConfigured()) {
      return { userId: null as string | null }
    }

    const { userId } = await auth()
    return { userId }
  },
)
