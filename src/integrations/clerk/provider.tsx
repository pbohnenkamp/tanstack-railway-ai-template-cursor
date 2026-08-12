import { ClerkProvider } from '@clerk/tanstack-react-start'

import { isClerkConfigured } from './config'

export default function AppClerkProvider({
  children,
}: {
  children: React.ReactNode
}) {
  if (!isClerkConfigured()) {
    return <>{children}</>
  }

  return <ClerkProvider>{children}</ClerkProvider>
}
