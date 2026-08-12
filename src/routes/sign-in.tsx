import { createFileRoute, Link } from '@tanstack/react-router'
import { SignIn } from '@clerk/tanstack-react-start'
import { z } from 'zod'

import { isClerkConfigured } from '#/integrations/clerk/config'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

// `redirect` is set by the _authenticated guard so that signing in returns the
// visitor to the page they asked for. Relative paths only — an absolute URL
// here would make this an open redirect.
//
// `.catch` drops an unusable value instead of throwing: a hand-edited or
// hostile query string should render the sign-in page, not a 500.
const searchSchema = z.object({
  redirect: z
    .string()
    .refine((value) => value.startsWith('/') && !value.startsWith('//'))
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/sign-in')({
  validateSearch: searchSchema,
  component: SignInPage,
})

function SignInPage() {
  const { redirect } = Route.useSearch()

  if (!isClerkConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col px-4 py-10">
        <section className="space-y-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">
            Sign in unavailable
          </h1>
          <p className="text-sm text-muted-foreground">
            Clerk is not configured, so authentication is bypassed. Set keys in{' '}
            <code>.env.local</code> (see <code>TEMPLATE_CHECKLIST.md</code>),
            restart the dev server, then return here.
          </p>
          <Link to="/" className={cn(buttonVariants())}>
            Back home
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center p-4">
      <SignIn forceRedirectUrl={redirect} />
    </main>
  )
}
