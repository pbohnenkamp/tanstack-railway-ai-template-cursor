import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Sends signed-out visitors to sign-in before anything under this layout
 * renders or loads. Running in `beforeLoad` means it works during SSR, so a
 * signed-out visitor gets a redirect rather than a child loader's error.
 *
 * This is user experience, not access control. Route matching happens in the
 * client's router too, and server functions are reachable without it — they
 * authorize themselves through `authed`. See docs/adr/0002.
 *
 * Add protected pages as children under `src/routes/_authenticated/`.
 * While Clerk is bypassed, `context.userId` is always null and this layout
 * redirects — that is expected; configure Clerk before building signed-in UX.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.userId) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
  },
  component: Outlet,
})
