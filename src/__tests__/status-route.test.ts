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

const mockDeviceId = vi.fn()
vi.mock('@/lib/device-id', () => ({
  getDeviceId: () => mockDeviceId(),
}))

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase-server', () => ({
  createAuthServerClient: () => Promise.resolve({ auth: { getUser: mockGetUser } }),
}))

const mockAnonymousId = vi.fn()
vi.mock('@/lib/anonymous-id', () => ({
  getAnonymousId: (uid: string) => mockAnonymousId(uid),
}))

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockResolvedValue({ data: [] }),
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}))

let statusGet: (req: Request) => Promise<unknown>

beforeEach(async () => {
  vi.clearAllMocks()
  mockDeviceId.mockResolvedValue('test-device')
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockAnonymousId.mockReturnValue('anon-123')
  mockSupabase.from.mockReturnThis()
  mockSupabase.select.mockReturnThis()
  mockSupabase.eq.mockReturnThis()
  mockSupabase.in.mockResolvedValue({ data: [] })

  const mod = await import('@/app/api/status/route')
  statusGet = mod.GET
})

describe('GET /api/status', () => {
  it('returns empty arrays when no post_ids param', async () => {
    const res = await statusGet(new Request('http://localhost/api/status')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      liked_post_ids: [],
      disliked_post_ids: [],
      bookmarked_post_ids: [],
    })
  })

  it('returns empty arrays when post_ids is empty string', async () => {
    const res = await statusGet(new Request('http://localhost/api/status?post_ids=')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      liked_post_ids: [],
      disliked_post_ids: [],
      bookmarked_post_ids: [],
    })
  })

  it('returns empty arrays when no device_id', async () => {
    mockDeviceId.mockResolvedValue(null)
    const res = await statusGet(new Request('http://localhost/api/status?post_ids=1,2')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      liked_post_ids: [],
      disliked_post_ids: [],
      bookmarked_post_ids: [],
    })
  })

  it('fetches likes, dislikes, and bookmarks in parallel', async () => {
    mockSupabase.in.mockResolvedValue({ data: [{ post_id: 1 }] })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const res = await statusGet(new Request('http://localhost/api/status?post_ids=1,2')) as unknown as MockResponse
    expect(res.status).toBe(200)
    // from() should be called for post_likes, post_dislikes, and post_bookmarks
    expect(mockSupabase.from).toHaveBeenCalledWith('post_likes')
    expect(mockSupabase.from).toHaveBeenCalledWith('post_dislikes')
    expect(mockSupabase.from).toHaveBeenCalledWith('post_bookmarks')
  })

  it('returns liked and disliked post ids', async () => {
    // Chain calls return different data per .in() invocation
    mockSupabase.in
      .mockResolvedValueOnce({ data: [{ post_id: 1 }] })   // likes
      .mockResolvedValueOnce({ data: [{ post_id: 2 }] })   // dislikes
      .mockResolvedValueOnce({ data: [{ post_id: 3 }] })   // bookmarks

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const res = await statusGet(new Request('http://localhost/api/status?post_ids=1,2,3')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.liked_post_ids).toEqual([1])
    expect(res.body.disliked_post_ids).toEqual([2])
    expect(res.body.bookmarked_post_ids).toEqual([3])
  })

  it('returns empty bookmarks when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockSupabase.in
      .mockResolvedValueOnce({ data: [{ post_id: 1 }] })   // likes
      .mockResolvedValueOnce({ data: [] })                   // dislikes

    const res = await statusGet(new Request('http://localhost/api/status?post_ids=1,2')) as unknown as MockResponse
    expect(res.status).toBe(200)
    expect(res.body.liked_post_ids).toEqual([1])
    expect(res.body.bookmarked_post_ids).toEqual([])
  })

  it('calls getAnonymousId with user id for bookmarks', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'uid-abc' } } })
    mockSupabase.in.mockResolvedValue({ data: [] })

    await statusGet(new Request('http://localhost/api/status?post_ids=1'))
    expect(mockAnonymousId).toHaveBeenCalledWith('uid-abc')
  })
})
