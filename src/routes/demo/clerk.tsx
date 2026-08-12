import { createFileRoute } from '@tanstack/react-router'
import { Show, SignIn, useUser } from '@clerk/tanstack-react-start'

import { isClerkConfigured } from '#/integrations/clerk/config'

export const Route = createFileRoute('/demo/clerk')({
  component: ClerkDemo,
})

function ClerkDemo() {
  if (!isClerkConfigured()) {
    return <ClerkNotConfiguredDemo />
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-10">
      <section className="w-full space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <Show when="signed-out">
          <div className="space-y-1.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Clerk
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground">
              Clerk renders the sign-in UI, manages sessions, and handles social
              providers for you.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <SignIn routing="hash" />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Built with{' '}
            <a
              href="https://clerk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground"
            >
              CLERK
            </a>
            .
          </p>
        </Show>

        <Show when="signed-in">
          <SignedInGreeting />
        </Show>
      </section>
    </main>
  )
}

function ClerkNotConfiguredDemo() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-10">
      <section className="w-full space-y-6 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="space-y-1.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Clerk · not configured
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Auth is bypassed
          </h1>
          <p className="text-sm text-muted-foreground">
            This template runs without Clerk until you add real API keys, so you
            can navigate example pages immediately. Sign-in UI and session
            middleware stay disabled until configuration is complete.
          </p>
        </div>

        <div
          role="alert"
          className="rounded-xl border bg-muted px-4 py-3 text-sm text-foreground"
        >
          <p className="m-0 font-semibold">Action required before production</p>
          <p className="mt-1 mb-0 text-sm text-muted-foreground">
            Set both keys in <code>.env.local</code>, restart the dev server,
            then return here to exercise sign-in. Track progress in{' '}
            <code>TEMPLATE_CHECKLIST.md</code>.
          </p>
        </div>

        <ol className="m-0 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Create an application in the{' '}
            <a
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground"
            >
              Clerk dashboard
            </a>
            .
          </li>
          <li>
            Copy keys into <code>.env.local</code>:
            <pre className="mt-2 overflow-x-auto rounded-lg border bg-background p-3 text-xs text-foreground">
              {`VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`}
            </pre>
          </li>
          <li>
            Restart <code>npm run dev</code> and reload this page.
          </li>
        </ol>

        <p className="text-center text-xs text-muted-foreground">
          Built with{' '}
          <a
            href="https://clerk.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground"
          >
            CLERK
          </a>
          .
        </p>
      </section>
    </main>
  )
}

function SignedInGreeting() {
  const { user } = useUser()
  if (!user) return null

  const email = user.primaryEmailAddress?.emailAddress
  const initial = (user.firstName || email || 'U').charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Clerk
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          You're signed in as {email}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="" className="h-10 w-10 rounded-full" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <span className="text-sm font-medium text-muted-foreground">
              {initial}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {user.firstName} {user.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Manage your account from the avatar in the header. Built with{' '}
        <a
          href="https://clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground"
        >
          CLERK
        </a>
        .
      </p>
    </div>
  )
}
