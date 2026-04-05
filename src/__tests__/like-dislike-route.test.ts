import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

const mockDeviceId = vi.fn()
vi.mock('@/lib/device-id', () => ({
  getDeviceId: () => mockDeviceId(),
}))

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [] }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
  delete: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ error: null }),
  rpc: vi.fn().mockResolvedValue({ error: null }),
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}))

function makePostReq(url: string, body: Record<string, unknown>): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDeviceId.mockResolvedValue('test-device')
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.in.mockResolvedValue({ data: [] })
  mockSupabase.maybeSingle.mockResolvedValue({ data: null })
  mockSupabase.delete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  mockSupabase.insert.mockResolvedValue({ error: null })
  mockSupabase.rpc.mockResolvedValue({ error: null })
})

// --- LIKE ---
describe('POST /api/like', () => {
  let likePost: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/like/route')
    likePost = mod.POST
  })

  it('rejects missing device_id', async () => {
    mockDeviceId.mockResolvedValue('')
    const res = await likePost(makePostReq('http://localhost/api/like', { post_id: 1 })) as any
    expect(res.status).toBe(400)
  })

  it('rejects missing post_id', async () => {
    const res = await likePost(makePostReq('http://localhost/api/like', {})) as any
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('投稿ID')
  })

  it('likes a post', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { liked: true, undid_dislike: false }, error: null })
    const res = await likePost(makePostReq('http://localhost/api/like', { post_id: 1 })) as any
    expect(res.status).toBe(200)
    expect(res.body.liked).toBe(true)
  })
})

// --- DISLIKE ---
describe('POST /api/dislike', () => {
  let dislikePost: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/dislike/route')
    dislikePost = mod.POST
  })

  it('rejects missing device_id', async () => {
    mockDeviceId.mockResolvedValue('')
    const res = await dislikePost(makePostReq('http://localhost/api/dislike', { post_id: 1 })) as any
    expect(res.status).toBe(400)
  })

  it('rejects missing post_id', async () => {
    const res = await dislikePost(makePostReq('http://localhost/api/dislike', {})) as any
    expect(res.status).toBe(400)
  })

  it('dislikes a post', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { disliked: true, undid_like: false }, error: null })
    const res = await dislikePost(makePostReq('http://localhost/api/dislike', { post_id: 1 })) as any
    expect(res.status).toBe(200)
    expect(res.body.disliked).toBe(true)
  })
})
