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

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase-server', () => ({
  createAuthServerClient: () => Promise.resolve({ auth: { getUser: mockGetUser } }),
}))

const mockAnonymousId = vi.fn()
vi.mock('@/lib/anonymous-id', () => ({
  getAnonymousId: (...args: unknown[]) => mockAnonymousId(...args),
}))

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [] }),
  order: vi.fn().mockResolvedValue({ data: [] }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
  delete: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ error: null }),
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

function makeGetReq(url: string): Request {
  return new Request(url, { method: 'GET' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
  mockAnonymousId.mockReturnValue('anon-abc')
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.in.mockResolvedValue({ data: [] })
  mockSupabase.order.mockResolvedValue({ data: [] })
  mockSupabase.maybeSingle.mockResolvedValue({ data: null })
  mockSupabase.delete.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })
  mockSupabase.insert.mockResolvedValue({ error: null })
})

// --- POST /api/bookmark ---
describe('POST /api/bookmark', () => {
  let postHandler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/bookmark/route')
    postHandler = mod.POST
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await postHandler(makePostReq('http://localhost/api/bookmark', { post_id: 1 })) as unknown as MockResponse
    expect(res.status).toBe(401)
    expect(res.body.message).toContain('ログイン')
  })

  it('returns 400 for missing post_id', async () => {
    const res = await postHandler(makePostReq('http://localhost/api/bookmark', {})) as unknown as MockResponse
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('投稿ID')
  })

  it('returns 400 for invalid post_id', async () => {
    const res = await postHandler(makePostReq('http://localhost/api/bookmark', { post_id: -1 })) as unknown as MockResponse
    expect(res.status).toBe(400)
  })

  it('returns 400 for non-integer post_id', async () => {
    const res = await postHandler(makePostReq('http://localhost/api/bookmark', { post_id: 'abc' })) as unknown as MockResponse
    expect(res.status).toBe(400)
  })

  it('adds bookmark when not yet bookmarked', async () => {
    // delete returns count 0 (nothing deleted), then insert succeeds
    mockSupabase.delete.mockReturnValue({
      count: 'exact',
      eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 0 }) }),
    })
    mockSupabase.insert.mockResolvedValue({ error: null })
    const res = await postHandler(makePostReq('http://localhost/api/bookmark', { post_id: 1 })) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.bookmarked).toBe(true)
  })

  it('removes bookmark when already bookmarked', async () => {
    // delete returns count 1 (row deleted)
    mockSupabase.delete.mockReturnValue({
      count: 'exact',
      eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 1 }) }),
    })
    const res = await postHandler(makePostReq('http://localhost/api/bookmark', { post_id: 1 })) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.bookmarked).toBe(false)
  })

  it('returns 500 on insert error', async () => {
    mockSupabase.delete.mockReturnValue({
      count: 'exact',
      eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ count: 0 }) }),
    })
    mockSupabase.insert.mockResolvedValue({ error: { message: 'db error' } })
    const res = await postHandler(makePostReq('http://localhost/api/bookmark', { post_id: 1 })) as unknown as MockResponse
    expect(res.status).toBe(500)
  })
})

// --- GET /api/bookmark ---
describe('GET /api/bookmark', () => {
  let getHandler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/bookmark/route')
    getHandler = mod.GET
  })

  it('returns empty array when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await getHandler(makeGetReq('http://localhost/api/bookmark')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.bookmarked_post_ids).toEqual([])
  })

  it('returns all bookmarks when no post_ids param', async () => {
    mockSupabase.order.mockResolvedValue({ data: [{ post_id: 10 }, { post_id: 20 }] })
    const res = await getHandler(makeGetReq('http://localhost/api/bookmark')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.bookmarked_post_ids).toEqual([10, 20])
  })

  it('returns bookmark status for specific post_ids', async () => {
    mockSupabase.in.mockResolvedValue({ data: [{ post_id: 5 }] })
    const res = await getHandler(makeGetReq('http://localhost/api/bookmark?post_ids=5,6,7')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.bookmarked_post_ids).toEqual([5])
  })

  it('returns empty when no bookmarks exist', async () => {
    mockSupabase.order.mockResolvedValue({ data: [] })
    const res = await getHandler(makeGetReq('http://localhost/api/bookmark')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.bookmarked_post_ids).toEqual([])
  })
})
