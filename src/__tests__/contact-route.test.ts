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
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null }),
  insert: vi.fn().mockResolvedValue({ error: null }),
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}))

vi.mock('@/lib/device-id', () => ({
  getDeviceId: vi.fn().mockResolvedValue('test-device-id'),
}))

vi.mock('@/lib/telegram', () => ({
  sendTelegram: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/contact/route'

function makeReq(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/contact', {
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
  mockSupabase.order.mockReturnThis()
  mockSupabase.limit.mockReturnThis()
  mockSupabase.single.mockResolvedValue({ data: null })
  mockSupabase.insert.mockResolvedValue({ error: null })
})

describe('POST /api/contact', () => {
  it('rejects empty message', async () => {
    const res = await POST(makeReq({ message: '' })) as unknown as MockResponse
    expect(res.status).toBe(400)
    expect(res.body.status).toBe('error')
  })

  it('rejects whitespace-only message', async () => {
    const res = await POST(makeReq({ message: '   ' })) as unknown as MockResponse
    expect(res.status).toBe(400)
  })

  it('accepts valid message', async () => {
    const res = await POST(makeReq({ message: 'バグ報告です' })) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(mockSupabase.insert).toHaveBeenCalled()
  })
})
