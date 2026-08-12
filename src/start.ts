import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

import { clerkMiddleware } from '@clerk/tanstack-react-start/server'

import {
  isClerkServerConfigured,
  warnIfClerkNotConfigured,
} from './integrations/clerk/config'

warnIfClerkNotConfigured()

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === 'serverFn',
})

// clerkMiddleware must run on each request so that `auth()` has a session to
// read inside server functions and route loaders — without it, `auth()` throws
// rather than returning a null userId. Skipped while Clerk keys are missing.
const requestMiddleware = isClerkServerConfigured()
  ? [csrfMiddleware, clerkMiddleware()]
  : [csrfMiddleware]

export const startInstance = createStart(() => ({
  requestMiddleware,
}))
