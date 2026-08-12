import { isClerkConfigured } from './config'

export default function ClerkNotConfiguredBanner() {
  if (isClerkConfigured()) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b bg-muted text-foreground"
    >
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:items-center">
        <span className="shrink-0 text-[0.7rem] font-bold tracking-wide uppercase text-muted-foreground">
          Clerk bypass
        </span>
        <p className="m-0 min-w-0 flex-1 leading-snug text-muted-foreground">
          Authentication is disabled because Clerk is not configured. Example
          pages stay navigable for local template exploration — configure keys
          in <code className="rounded-sm bg-background px-1.5 py-0.5 text-[0.85em]">
            .env.local
          </code>{' '}
          before shipping. See{' '}
          <a
            href="/demo/clerk"
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            /demo/clerk
          </a>{' '}
          and{' '}
          <code className="rounded-sm bg-background px-1.5 py-0.5 text-[0.85em]">
            TEMPLATE_CHECKLIST.md
          </code>
          .
        </p>
      </div>
    </div>
  )
}
