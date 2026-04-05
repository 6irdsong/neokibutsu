import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/server
interface MockResponse { body: Record<string, unknown>; status: number }
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: Record<string, unknown>, init?: { status?: number }): MockResponse => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

// Mock supabase
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
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

import { POST } from '@/app/api/post/route'

function makeFormData(fields: Record<string, string>): Request {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.append(k, v)
  return new Request('http://localhost/api/post', { method: 'POST', body: form })
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

describe('POST /api/post', () => {
  it('returns success silently for honeypot', async () => {
    const req = makeFormData({ honeypot: 'on', subject: 'x', teacher: 'y' })
    const res = await POST(req) as unknown as MockResponse
    expect(res.body.status).toBe('success')
    expect(mockSupabase.insert).not.toHaveBeenCalled()
  })

  it('rejects missing subject', async () => {
    const req = makeFormData({ subject: '', teacher: '山田', category: '全学教育科目', comment: 'test', rating: '仏' })
    const res = await POST(req) as unknown as MockResponse
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('講義名')
  })

  it('rejects missing teacher', async () => {
    const req = makeFormData({ subject: '数学', teacher: '', category: '全学教育科目', comment: 'test', rating: '仏' })
    const res = await POST(req) as unknown as MockResponse
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('教員名')
  })

  it('rejects invalid category', async () => {
    const req = makeFormData({ subject: '数学', teacher: '山田', category: '不正な値', comment: 'test', rating: '仏' })
    const res = await POST(req) as unknown as MockResponse
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('科目区分')
  })

  it('accepts valid post', async () => {
    const req = makeFormData({
      subject: '微分積分学I',
      teacher: '山田太郎',
      category: '全学教育科目',
      rating: '仏',
      comment: '良い授業',
      author: '',
    })
    const res = await POST(req) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(mockSupabase.insert).toHaveBeenCalled()
  })

  it('defaults author to 匿名', async () => {
    const req = makeFormData({
      subject: '物理',
      teacher: '佐藤',
      category: '専門科目',
      rating: '鬼',
      comment: 'きつい',
      author: '',
    })
    await POST(req)
    const insertArg = mockSupabase.insert.mock.calls[0][0]
    expect(insertArg.author).toBe('匿名')
  })

  it('trims fullwidth spaces in subject', async () => {
    const req = makeFormData({
      subject: '　微分積分学　',
      teacher: '山田',
      category: '全学教育科目',
      rating: '並',
      comment: 'テスト',
    })
    await POST(req)
    const insertArg = mockSupabase.insert.mock.calls[0][0]
    expect(insertArg.subject).toBe('微分積分学')
  })
})
