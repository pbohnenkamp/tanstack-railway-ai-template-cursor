import { createFileRoute, Link } from '@tanstack/react-router'

import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

/**
 * Scaffold for a signed-in page. Lives under `_authenticated` so visitors
 * without a session are redirected to `/sign-in` (UX only). Any server
 * function this page calls must still use `authed` + row `userId` scope —
 * see docs/adr/0002.
 *
 * Replace or delete this route when you add real product pages.
 */
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { userId } = Route.useRouteContext()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col px-4 py-10">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Authenticated
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          You are signed in as <code className="text-foreground">{userId}</code>.
          This layout redirect is UX only — protect data with{' '}
          <code className="text-foreground">authed</code>.
        </p>
        <Link to="/" className={cn(buttonVariants({ variant: 'outline' }))}>
          Back home
        </Link>
      </section>
    </main>
  )
}
