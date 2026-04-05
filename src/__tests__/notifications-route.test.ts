import { describe, it, expect, vi, beforeEach } from 'vitest'

interface MockResponse { body: Record<string, unknown>; status: number }

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: Record<string, unknown>, init?: { status?: number }): MockResponse => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [] }),
  update: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}))

const mockGetDeviceId = vi.fn().mockResolvedValue(null)
vi.mock('@/lib/device-id', () => ({
  getDeviceId: (...args: unknown[]) => mockGetDeviceId(...args),
}))

const mockGetAnonymousId = vi.fn().mockResolvedValue(null)
vi.mock('@/lib/anonymous-id', () => ({
  getAnonymousIdFromSession: (...args: unknown[]) => mockGetAnonymousId(...args),
}))

import { GET } from '@/app/api/notifications/route'
import { POST } from '@/app/api/notifications/read/route'

beforeEach(() => {
  vi.clearAllMocks()
  mockGetDeviceId.mockResolvedValue(null)
  mockGetAnonymousId.mockResolvedValue(null)
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.is.mockReturnThis()
  mockSupabase.order.mockResolvedValue({ data: [] })
  mockSupabase.update.mockReturnThis()
})

// ---------------------------------------------------------------------------
// GET /api/notifications
// ---------------------------------------------------------------------------
describe('GET /api/notifications', () => {
  it('returns [] when no deviceId and no anonymousId', async () => {
    const res = await GET() as unknown as { body: unknown[]; status: number }
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('queries by device_id only when no anonymousId', async () => {
    mockGetDeviceId.mockResolvedValue('device-123')
    const notifications = [
      { id: 1, message: 'hello', created_at: '2026-03-01T00:00:00Z' },
    ]
    mockSupabase.order.mockResolvedValue({ data: notifications })

    const res = await GET() as unknown as { body: unknown[]; status: number }
    expect(res.status).toBe(200)
    expect(res.body).toEqual(notifications)
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications')
    expect(mockSupabase.eq).toHaveBeenCalledWith('device_id', 'device-123')
  })

  it('returns [] on supabase error for device_id only path', async () => {
    mockGetDeviceId.mockResolvedValue('device-123')
    mockSupabase.order.mockResolvedValue({ data: null, error: { message: 'fail' } })

    const res = await GET() as unknown as { body: unknown[]; status: number }
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('queries by anonymous_id when anonymousId exists (no deviceId)', async () => {
    mockGetAnonymousId.mockResolvedValue('anon-abc')
    const notifications = [
      { id: 2, message: 'account notif', created_at: '2026-03-02T00:00:00Z' },
    ]
    mockSupabase.order.mockResolvedValue({ data: notifications })

    const res = await GET() as unknown as { body: unknown[]; status: number }
    expect(res.status).toBe(200)
    expect(res.body).toEqual(notifications)
    expect(mockSupabase.eq).toHaveBeenCalledWith('anonymous_id', 'anon-abc')
  })

  it('merges account and device notifications when both ids exist', async () => {
    mockGetDeviceId.mockResolvedValue('device-123')
    mockGetAnonymousId.mockResolvedValue('anon-abc')

    const accountNotifs = [
      { id: 1, message: 'account', created_at: '2026-03-02T00:00:00Z' },
    ]
    const deviceNotifs = [
      { id: 2, message: 'device', created_at: '2026-03-03T00:00:00Z' },
    ]

    // First call: account-based query
    mockSupabase.order
      .mockResolvedValueOnce({ data: accountNotifs })
      // Second call: device-based query
      .mockResolvedValueOnce({ data: deviceNotifs })

    const res = await GET() as unknown as { body: unknown[]; status: number }
    expect(res.status).toBe(200)
    // Merged and sorted descending by created_at
    expect(res.body).toEqual([deviceNotifs[0], accountNotifs[0]])
    expect(mockSupabase.is).toHaveBeenCalledWith('anonymous_id', null)
  })
})

// ---------------------------------------------------------------------------
// POST /api/notifications/read
// ---------------------------------------------------------------------------
describe('POST /api/notifications/read', () => {
  it('returns error 400 when no deviceId and no anonymousId', async () => {
    const res = await POST() as unknown as MockResponse
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ status: 'error' })
  })

  it('marks account notifications as read when anonymousId exists', async () => {
    mockGetAnonymousId.mockResolvedValue('anon-abc')

    const res = await POST() as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'success' })
    expect(mockSupabase.update).toHaveBeenCalledWith({ is_read: true })
    expect(mockSupabase.eq).toHaveBeenCalledWith('anonymous_id', 'anon-abc')
  })

  it('marks device notifications as read when deviceId exists', async () => {
    mockGetDeviceId.mockResolvedValue('device-123')

    const res = await POST() as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'success' })
    expect(mockSupabase.update).toHaveBeenCalledWith({ is_read: true })
    expect(mockSupabase.eq).toHaveBeenCalledWith('device_id', 'device-123')
    expect(mockSupabase.is).toHaveBeenCalledWith('anonymous_id', null)
  })

  it('marks both account and device notifications when both ids exist', async () => {
    mockGetDeviceId.mockResolvedValue('device-123')
    mockGetAnonymousId.mockResolvedValue('anon-abc')

    const res = await POST() as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'success' })
    expect(mockSupabase.update).toHaveBeenCalledTimes(2)
    expect(mockSupabase.eq).toHaveBeenCalledWith('anonymous_id', 'anon-abc')
    expect(mockSupabase.eq).toHaveBeenCalledWith('device_id', 'device-123')
  })
})
