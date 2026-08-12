import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, isClerkServerConfiguredMock } = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<{ userId: string | null }>>(),
  isClerkServerConfiguredMock: vi.fn<() => boolean>(),
}))

vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: authMock,
}))

vi.mock('#/integrations/clerk/config', () => ({
  isClerkServerConfigured: isClerkServerConfiguredMock,
}))

const { authed } = await import('#/lib/server-auth')

/**
 * The ADR-0002 authentication boundary. Every server function built on this
 * wrapper inherits these assertions — including ones written after this file.
 */
describe('authed', () => {
  beforeEach(() => {
    authMock.mockReset()
    isClerkServerConfiguredMock.mockReset()
    isClerkServerConfiguredMock.mockReturnValue(true)
  })

  it('rejects when Clerk is not configured', async () => {
    isClerkServerConfiguredMock.mockReturnValue(false)
    const handler = authed(async () => 'data')

    await expect(handler({ data: undefined })).rejects.toThrow('Unauthorized')
    expect(authMock).not.toHaveBeenCalled()
  })

  it('rejects an anonymous caller', async () => {
    authMock.mockResolvedValue({ userId: null })
    const handler = authed(async () => 'data')

    await expect(handler({ data: undefined })).rejects.toThrow('Unauthorized')
  })

  // The one that matters: rejecting is not enough if the query already ran.
  it('does not run the handler when there is no session', async () => {
    authMock.mockResolvedValue({ userId: null })
    const inner = vi.fn(async () => 'data')
    const handler = authed(inner)

    await expect(handler({ data: undefined })).rejects.toThrow('Unauthorized')
    expect(inner).not.toHaveBeenCalled()
  })

  it('gives the handler the resolved userId', async () => {
    authMock.mockResolvedValue({ userId: 'user_a' })
    const handler = authed(
      async ({ userId }: { data: undefined; userId: string }) => userId,
    )

    await expect(handler({ data: undefined })).resolves.toBe('user_a')
  })

  it('passes validated input through untouched', async () => {
    authMock.mockResolvedValue({ userId: 'user_a' })
    const handler = authed(
      async ({ data }: { data: { id: number }; userId: string }) => data,
    )

    await expect(handler({ data: { id: 7 } })).resolves.toEqual({ id: 7 })
  })

  it('propagates handler errors rather than masking them as auth failures', async () => {
    authMock.mockResolvedValue({ userId: 'user_a' })
    const handler = authed(async () => {
      throw new Error('Not found')
    })

    await expect(handler({ data: undefined })).rejects.toThrow('Not found')
  })
})
