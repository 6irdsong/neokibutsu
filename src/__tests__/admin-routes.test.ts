import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

const mockIsAdmin = vi.fn()
vi.mock('@/lib/admin', () => ({
  isAdmin: () => mockIsAdmin(),
}))

// Chainable mock: any method call returns a new chainable, awaiting resolves { error: null, data: [] }
function createChainMock(): unknown {
  const fn = (() => createChainMock()) as unknown as Record<string | symbol, unknown>
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve({ error: null, data: [] })
      }
      return () => createChainMock()
    },
    apply() {
      return createChainMock()
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

// --- DELETE ---
describe('POST /api/delete', () => {
  let deleteHandler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/delete/route')
    deleteHandler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = await deleteHandler(makeReq('http://localhost/api/delete', { id: 1 })) as any
    expect(res.status).toBe(403)
  })

  it('soft-deletes post as admin', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = await deleteHandler(makeReq('http://localhost/api/delete', { id: 1 })) as any
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(mockFrom).toHaveBeenCalledWith('posts')
  })
})

// --- RESTORE ---
describe('POST /api/admin/restore', () => {
  let restoreHandler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/admin/restore/route')
    restoreHandler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = await restoreHandler(makeReq('http://localhost/api/admin/restore', { id: 1 })) as any
    expect(res.status).toBe(403)
  })

  it('restores post as admin', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = await restoreHandler(makeReq('http://localhost/api/admin/restore', { id: 1 })) as any
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.message).toContain('復元')
  })
})

// --- PURGE ---
describe('POST /api/admin/purge', () => {
  let purgeHandler: () => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/admin/purge/route')
    purgeHandler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = await purgeHandler() as any
    expect(res.status).toBe(403)
  })

  it('purges old deleted posts as admin', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = await purgeHandler() as any
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
    expect(res.body.purged).toBe(0)
  })
})

// --- BAN ---
describe('POST /api/ban', () => {
  let banHandler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/ban/route')
    banHandler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = await banHandler(makeReq('http://localhost/api/ban', { device_id: 'abc' })) as any
    expect(res.status).toBe(403)
  })

  it('bans device as admin', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = await banHandler(makeReq('http://localhost/api/ban', { device_id: 'abc' })) as any
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('abc')
  })
})

// --- UNBAN ---
describe('POST /api/admin/unban', () => {
  let unbanHandler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/admin/unban/route')
    unbanHandler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = await unbanHandler(makeReq('http://localhost/api/admin/unban', { device_id: 'abc' })) as any
    expect(res.status).toBe(403)
  })

  it('unbans device as admin', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = await unbanHandler(makeReq('http://localhost/api/admin/unban', { device_id: 'abc' })) as any
    expect(res.status).toBe(200)
    expect(res.body.message).toContain('abc')
  })
})

// --- UPDATE CATEGORY ---
describe('POST /api/update-category', () => {
  let updateCategoryHandler: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    const mod = await import('@/app/api/update-category/route')
    updateCategoryHandler = mod.POST
  })

  it('rejects non-admin', async () => {
    mockIsAdmin.mockResolvedValue(false)
    const res = await updateCategoryHandler(makeReq('http://localhost/api/update-category', { post_id: 1, category: '専門科目' })) as any
    expect(res.status).toBe(403)
  })

  it('rejects invalid category', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = await updateCategoryHandler(makeReq('http://localhost/api/update-category', { post_id: 1, category: '不正' })) as any
    expect(res.status).toBe(400)
    expect(res.body.message).toContain('無効')
  })

  it('updates category as admin', async () => {
    mockIsAdmin.mockResolvedValue(true)
    const res = await updateCategoryHandler(makeReq('http://localhost/api/update-category', { post_id: 1, category: '全学教育科目' })) as any
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('success')
  })
})
