import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null }),
  insert: vi.fn().mockResolvedValue({ error: null }),
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}))

vi.mock('@/lib/device-id', () => ({
  getDeviceId: vi.fn().mockResolvedValue('reporter-device'),
  getDeviceIdInfo: vi.fn().mockResolvedValue({ uuid: 'reporter-device', timestamp: '20260321T120000', susCount: 0, raw: '' }),
}))

vi.mock('@/lib/anonymous-id', () => ({
  getAnonymousIdFromSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/telegram', () => ({
  sendTelegram: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/report/route'
import { sendTelegram } from '@/lib/telegram'

function makeReq(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.gt.mockReturnThis()
  mockSupabase.order.mockReturnThis()
  mockSupabase.limit.mockReturnThis()
  mockSupabase.single.mockResolvedValue({ data: null })
  mockSupabase.insert.mockResolvedValue({ error: null })
})

describe('POST /api/report', () => {
  it('rejects missing post_id', async () => {
    const res = await POST(makeReq({ subject: '数学', reason: '誹謗中傷' })) as any
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('必須項目')
  })

  it('rejects missing subject', async () => {
    const res = await POST(makeReq({ post_id: 1, reason: '誹謗中傷' })) as any
    expect(res.status).toBe(400)
  })

  it('rejects missing reason', async () => {
    const res = await POST(makeReq({ post_id: 1, subject: '数学' })) as any
    expect(res.status).toBe(400)
  })

  it('accepts valid report and sends telegram', async () => {
    // Mock: no rate limit, post lookup returns device_id
    mockSupabase.single
      .mockResolvedValueOnce({ data: { device_id: 'target-device' } }) // post lookup
      .mockResolvedValueOnce({ data: null }) // rate limit check

    // Mock: hourly count
    mockSupabase.gt.mockReturnValue({ count: 0 })

    const res = await POST(makeReq({
      post_id: 42,
      subject: '微分積分学',
      category: '誹謗中傷',
      reason: '誹謗中傷が含まれている',
      date: '2026年01月01日',
      author: '匿名',
    })) as any

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(mockSupabase.insert).toHaveBeenCalled()
    expect(sendTelegram).toHaveBeenCalled()
  })
})
