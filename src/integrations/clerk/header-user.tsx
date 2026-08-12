import { Show, SignInButton, UserButton } from '@clerk/tanstack-react-start'

import { isClerkConfigured } from './config'

export default function HeaderUser() {
  if (!isClerkConfigured()) {
    return (
      <span
        className="hidden rounded-lg border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex"
        title="Set VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in .env.local"
      >
        Clerk off
      </span>
    )
  }

  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton />
      </Show>
    </>
  )
}
