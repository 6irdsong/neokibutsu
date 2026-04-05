import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => {
  class MockNextResponse {
    body: unknown
    status: number
    headers: Map<string, string>
    constructor(body: unknown, init?: { headers?: Record<string, string> }) {
      this.body = body
      this.status = 200
      this.headers = new Map(Object.entries(init?.headers || {}))
    }
    static json(body: Record<string, unknown>, init?: { status?: number }) {
      return { body, status: init?.status ?? 200 }
    }
  }
  return { NextResponse: MockNextResponse }
})

const mockIsAdmin = vi.fn()
vi.mock('@/lib/admin', () => ({
  isAdmin: () => mockIsAdmin(),
}))

vi.mock('@/lib/normalize', () => ({
  normalizeSearch: (s: string) => s,
}))

// Chainable mock: any method call returns a new chainable, awaiting resolves { error: null, data: [] }
function createChainMock(resolveValue?: unknown): unknown {
  const defaultValue = resolveValue ?? { error: null, data: [], count: 0 }
  const fn = (() => createChainMock(resolveValue)) as unknown as Record<string | symbol, unknown>
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(defaultValue)
      }
      return () => createChainMock(resolveValue)
    },
    apply() {
      return createChainMock(resolveValue)
    },
  })
}

const mockSupabase = {
  from: vi.fn(() => createChainMock()),
}

const mockFrom = mockSupabase.from

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase,
}))

function makeReq(url: string, body: Record<string, unknown>): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockImplementation(() => createChainMock())
})

// --- REPORT RESPOND ---
describe('POST /api/admin/report/respond', () => {
  let handler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/admin/report/respond/route')
    handler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = (await handler(
      makeReq('http://localhost/api/admin/report/respond', { report_id: 1 })
    )) as any
    expect(res.status).toBe(403)
  })

  it('rejects invalid report_id', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = (await handler(
      makeReq('http://localhost/api/admin/report/respond', { report_id: 'abc' })
    )) as any
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('無効')
  })

  it('updates report status and creates notification', async () => {
    mockIsAdmin.mockResolvedValue(true)

    // First call: update reports -> success
    // Second call: select report -> return reporter info
    // Third call: insert notification -> success
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // update chain
        return createChainMock({ error: null })
      }
      if (callCount === 2) {
        // select report with reporter info
        return createChainMock({
          data: {
            reporter_device_id: 'device123',
            reporter_anonymous_id: 'anon456',
            subject: 'テスト講義',
          },
          error: null,
        })
      }
      // insert notification
      return createChainMock({ error: null })
    })

    const res = (await handler(
      makeReq('http://localhost/api/admin/report/respond', {
        report_id: 1,
        admin_response: '対応しました',
      })
    )) as any
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.message).toBe('通報に対応しました。')
    expect(mockFrom).toHaveBeenCalledWith('reports')
    expect(mockFrom).toHaveBeenCalledWith('notifications')
  })
})

// --- EDIT COMMENT ---
describe('POST /api/admin/edit-comment', () => {
  let handler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/admin/edit-comment/route')
    handler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = (await handler(
      makeReq('http://localhost/api/admin/edit-comment', { post_id: 1, comment: 'test' })
    )) as any
    expect(res.status).toBe(403)
  })

  it('rejects invalid post_id', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = (await handler(
      makeReq('http://localhost/api/admin/edit-comment', { post_id: 'abc', comment: 'test' })
    )) as any
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('無効')
  })

  it('rejects missing comment', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = (await handler(
      makeReq('http://localhost/api/admin/edit-comment', { post_id: 1 })
    )) as any
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('コメント')
  })

  it('updates comment successfully', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = (await handler(
      makeReq('http://localhost/api/admin/edit-comment', { post_id: 1, comment: '更新コメント' })
    )) as any
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.message).toBe('コメントを更新しました')
    expect(mockFrom).toHaveBeenCalledWith('posts')
  })
})

// --- ADMIN POSTS ---
describe('POST /api/admin/posts', () => {
  let handler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/admin/posts/route')
    handler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = (await handler(
      makeReq('http://localhost/api/admin/posts', {})
    )) as any
    expect(res.status).toBe(403)
  })

  it('returns paginated posts', async () => {
    mockIsAdmin.mockResolvedValue(true)

    const fakePosts = [{ id: 1, subject: 'テスト' }]
    mockFrom.mockImplementation(() =>
      createChainMock({ error: null, data: fakePosts, count: 1 })
    )

    const res = (await handler(
      makeReq('http://localhost/api/admin/posts', { page: '1' })
    )) as any
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('posts')
    expect(res.body).toHaveProperty('page')
    expect(res.body).toHaveProperty('totalPages')
    expect(res.body).toHaveProperty('total')
    expect(mockFrom).toHaveBeenCalledWith('posts')
  })
})

// --- EXPORT CSV ---
describe('POST /api/admin/export-csv', () => {
  let handler: () => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/admin/export-csv/route')
    handler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = (await handler()) as any
    expect(res.status).toBe(403)
  })

  it('returns CSV with BOM and correct headers', async () => {
    mockIsAdmin.mockResolvedValue(true)

    const fakePosts = [
      {
        id: 1,
        subject: '数学',
        teacher: '田中',
        rating: 5,
        test: 'あり',
        assignment: 'なし',
        report: 'なし',
        attendance: 'あり',
        comment: 'いい授業',
        date: '2024-01-01',
        author: 'user1',
        ip: '127.0.0.1',
        device_id: 'dev1',
        category: '全学教育科目',
      },
    ]
    mockFrom.mockImplementation(() =>
      createChainMock({ error: null, data: fakePosts })
    )

    const res = (await handler()) as any
    // NextResponse constructor: body is the raw CSV string
    const csv = res.body as string
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('ID,講義名,教員名')
    expect(csv).toContain('数学')
    expect(csv).toContain('田中')
    expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(res.headers.get('Content-Disposition')).toContain('neokibutsu_export.csv')
  })
})
