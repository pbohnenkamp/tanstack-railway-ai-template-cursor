/**
 * Clerk is optional in this template so example pages stay navigable before
 * real API keys are added. Keys must look like Clerk credentials (pk_/sk_),
 * not empty strings or placeholders such as UNKNOWN.
 */

const PLACEHOLDER_KEYS = new Set([
  '',
  'unknown',
  'unkown',
  'your_key_here',
  'pk_test_...',
  'sk_test_...',
  'changeme',
])

function normalize(value: string | undefined | null): string {
  return (value ?? '').trim()
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_KEYS.has(value.toLowerCase())
}

export function getClerkPublishableKey(): string {
  const fromImportMeta =
    typeof import.meta !== 'undefined'
      ? normalize(
          import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY as string | undefined,
        )
      : ''

  if (fromImportMeta) return fromImportMeta

  return normalize(process.env.VITE_CLERK_PUBLISHABLE_KEY)
}

export function getClerkSecretKey(): string {
  return normalize(process.env.CLERK_SECRET_KEY)
}

export function isValidClerkPublishableKey(key: string): boolean {
  return /^pk_(test|live)_[A-Za-z0-9]+/.test(key) && !isPlaceholder(key)
}

export function isValidClerkSecretKey(key: string): boolean {
  return /^sk_(test|live)_[A-Za-z0-9]+/.test(key) && !isPlaceholder(key)
}

/** Client + SSR: publishable key looks real. Drives UI bypass / banners. */
export function isClerkConfigured(): boolean {
  return isValidClerkPublishableKey(getClerkPublishableKey())
}

/** Server: both keys look real. Required before enabling clerkMiddleware. */
export function isClerkServerConfigured(): boolean {
  return isClerkConfigured() && isValidClerkSecretKey(getClerkSecretKey())
}

let hasLoggedClerkWarning = false

/**
 * Emit a one-time critical warning on the server when Clerk is missing or
 * incomplete. Safe to call from module init and request middleware.
 */
export function warnIfClerkNotConfigured(): void {
  if (hasLoggedClerkWarning) return
  if (typeof window !== 'undefined') return

  hasLoggedClerkWarning = true

  if (isClerkServerConfigured()) return

  const publishableOk = isValidClerkPublishableKey(getClerkPublishableKey())
  const secretOk = isValidClerkSecretKey(getClerkSecretKey())

  const details = [
    !publishableOk
      ? '  - VITE_CLERK_PUBLISHABLE_KEY is missing or invalid (expected pk_test_… / pk_live_…)'
      : null,
    !secretOk
      ? '  - CLERK_SECRET_KEY is missing or invalid (expected sk_test_… / sk_live_…)'
      : null,
  ]
    .filter(Boolean)
    .join('\n')

  console.error(`
══════════════════════════════════════════════════════════════════════════════
 CRITICAL: Clerk authentication is NOT configured
══════════════════════════════════════════════════════════════════════════════
 Auth is bypassed so this template can be explored without Clerk keys.
 Do NOT deploy or ship protected features until Clerk is configured.

${details}

 Set keys in .env.local (see .env.example), then restart the dev server.
 Checklist: TEMPLATE_CHECKLIST.md → "Configure Clerk"
 Docs: https://dashboard.clerk.com → API Keys
══════════════════════════════════════════════════════════════════════════════
`)
}
