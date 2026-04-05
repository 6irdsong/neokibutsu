import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase-server
const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/supabase-server', () => ({
  createAuthServerClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

import { getAnonymousId, getAnonymousIdFromSession } from '@/lib/anonymous-id'

describe('getAnonymousId', () => {
  it('returns consistent hash for same input', () => {
    const a = getAnonymousId('user-1')
    const b = getAnonymousId('user-1')
    expect(a).toBe(b)
  })

  it('returns different hash for different inputs', () => {
    const a = getAnonymousId('user-1')
    const b = getAnonymousId('user-2')
    expect(a).not.toBe(b)
  })

  it('returns a hex string of length 64', () => {
    const hash = getAnonymousId('user-1')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('getAnonymousIdFromSession', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('returns null when no user session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await getAnonymousIdFromSession()
    expect(result).toBeNull()
  })

  it('returns anonymous ID when user is logged in', async () => {
    const userId = 'test-user-id'
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } } })
    const result = await getAnonymousIdFromSession()
    expect(result).toBe(getAnonymousId(userId))
  })
})
