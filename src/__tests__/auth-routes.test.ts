import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// --- Mocks for /api/auth/google route ---

interface MockRedirectResponse {
  url: string
  cookies: {
    set: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

vi.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: string | URL): MockRedirectResponse => ({
      url: typeof url === 'string' ? url : url.toString(),
      cookies: {
        set: vi.fn(),
        delete: vi.fn(),
      },
    }),
  },
}))

// --- Mocks for /api/auth/callback route ---

const mockCookieStore = {
  get: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}))

const mockSignInWithIdToken = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { signInWithIdToken: mockSignInWithIdToken },
  }),
}))

// Helper to create a fake ID token with a given email
function fakeIdToken(email: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ email, sub: '12345' })).toString('base64url')
  return `${header}.${payload}.fake-signature`
}

// --- Google route tests ---

describe('GET /api/auth/google', () => {
  let googleGet: (req: Request) => Promise<unknown>

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id'
    const mod = await import('@/app/api/auth/google/route')
    googleGet = mod.GET
  })

  it('redirects to Google OAuth with correct params', async () => {
    const res = await googleGet(new Request('http://localhost/api/auth/google')) as MockRedirectResponse
    const url = new URL(res.url)
    expect(url.origin).toBe('https://accounts.google.com')
    expect(url.pathname).toBe('/o/oauth2/v2/auth')
    expect(url.searchParams.get('client_id')).toBe('test-client-id')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost/api/auth/callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('scope')).toBe('openid email profile')
    expect(url.searchParams.get('hd')).toBe('elms.hokudai.ac.jp')
    expect(url.searchParams.get('prompt')).toBe('select_account')
  })

  it('sets oauth_state cookie (httpOnly, secure, sameSite lax)', async () => {
    const res = await googleGet(new Request('http://localhost/api/auth/google')) as MockRedirectResponse
    expect(res.cookies.set).toHaveBeenCalledWith(
      'oauth_state',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      }),
    )
  })

  it('state contains CSRF token and redirectTo', async () => {
    const res = await googleGet(
      new Request('http://localhost/api/auth/google?redirectTo=/lectures/123')
    ) as MockRedirectResponse
    const url = new URL(res.url)
    const state = JSON.parse(url.searchParams.get('state')!)
    expect(state).toHaveProperty('csrf')
    expect(state.csrf).toHaveLength(64) // 32 bytes hex
    expect(state.redirectTo).toBe('/lectures/123')
  })

  it('CSRF token in state matches the cookie value', async () => {
    const res = await googleGet(new Request('http://localhost/api/auth/google')) as MockRedirectResponse
    const url = new URL(res.url)
    const state = JSON.parse(url.searchParams.get('state')!)
    const cookieValue = res.cookies.set.mock.calls[0][1]
    expect(state.csrf).toBe(cookieValue)
  })

  it('prevents open redirect: protocol-relative URL', async () => {
    const res = await googleGet(
      new Request('http://localhost/api/auth/google?redirectTo=//evil.com')
    ) as MockRedirectResponse
    const url = new URL(res.url)
    const state = JSON.parse(url.searchParams.get('state')!)
    expect(state.redirectTo).toBe('/')
  })

  it('prevents open redirect: absolute URL', async () => {
    const res = await googleGet(
      new Request('http://localhost/api/auth/google?redirectTo=https://evil.com')
    ) as MockRedirectResponse
    const url = new URL(res.url)
    const state = JSON.parse(url.searchParams.get('state')!)
    expect(state.redirectTo).toBe('/')
  })

  it('defaults redirectTo to / when not provided', async () => {
    const res = await googleGet(new Request('http://localhost/api/auth/google')) as MockRedirectResponse
    const url = new URL(res.url)
    const state = JSON.parse(url.searchParams.get('state')!)
    expect(state.redirectTo).toBe('/')
  })
})

// --- Callback route tests ---

describe('GET /api/auth/callback', () => {
  let callbackGet: (req: Request) => Promise<unknown>
  const originalFetch = global.fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

    const mod = await import('@/app/api/auth/callback/route')
    callbackGet = mod.GET
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  function callbackUrl(params: Record<string, string>): string {
    const sp = new URLSearchParams(params)
    return `http://localhost/api/auth/callback?${sp.toString()}`
  }

  it('redirects to /?auth_error=cancelled when error param present', async () => {
    const res = await callbackGet(
      new Request(callbackUrl({ error: 'access_denied', code: 'abc', state: '{}' }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=cancelled')
  })

  it('redirects to /?auth_error=cancelled when no code', async () => {
    const res = await callbackGet(
      new Request(callbackUrl({ state: '{}' }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=cancelled')
  })

  it('redirects to /?auth_error=invalid_state when state is not valid JSON', async () => {
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'abc', state: 'not-json' }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=invalid_state')
  })

  it('redirects to /?auth_error=csrf_mismatch when CSRF does not match cookie', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'cookie-csrf-token' })
    const state = JSON.stringify({ csrf: 'different-token', redirectTo: '/' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'abc', state }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=csrf_mismatch')
  })

  it('redirects to /?auth_error=csrf_mismatch when no oauth_state cookie', async () => {
    mockCookieStore.get.mockReturnValue(undefined)
    const state = JSON.stringify({ csrf: 'some-token', redirectTo: '/' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'abc', state }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=csrf_mismatch')
  })

  it('redirects to /?auth_error=token_exchange_failed when Google rejects code', async () => {
    mockCookieStore.get.mockReturnValue({ value: 'valid-csrf' })
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
    const state = JSON.stringify({ csrf: 'valid-csrf', redirectTo: '/' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'bad-code', state }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=token_exchange_failed')
  })

  it('redirects to /?auth_error=invalid_domain for non-hokudai email', async () => {
    const token = fakeIdToken('user@gmail.com')
    mockCookieStore.get.mockReturnValue({ value: 'valid-csrf' })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: token }),
    }) as unknown as typeof fetch
    const state = JSON.stringify({ csrf: 'valid-csrf', redirectTo: '/' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'good-code', state }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=invalid_domain')
  })

  it('redirects to /?auth_error=supabase_signin_failed on Supabase error', async () => {
    const token = fakeIdToken('user@elms.hokudai.ac.jp')
    mockCookieStore.get.mockReturnValue({ value: 'valid-csrf' })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: token }),
    }) as unknown as typeof fetch
    mockSignInWithIdToken.mockResolvedValue({ data: { session: null }, error: new Error('fail') })
    const state = JSON.stringify({ csrf: 'valid-csrf', redirectTo: '/' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'good-code', state }))
    ) as MockRedirectResponse
    expect(res.url).toContain('auth_error=supabase_signin_failed')
  })

  it('redirects with session fragment on success', async () => {
    const token = fakeIdToken('user@elms.hokudai.ac.jp')
    mockCookieStore.get.mockReturnValue({ value: 'valid-csrf' })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: token }),
    }) as unknown as typeof fetch
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        session: {
          access_token: 'at-123',
          refresh_token: 'rt-456',
          expires_in: 3600,
        },
      },
      error: null,
    })
    const state = JSON.stringify({ csrf: 'valid-csrf', redirectTo: '/lectures' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'good-code', state }))
    ) as MockRedirectResponse

    // Should redirect to the requested path with session in fragment
    expect(res.url).toContain('/lectures#')
    expect(res.url).toContain('access_token=at-123')
    expect(res.url).toContain('refresh_token=rt-456')
    expect(res.url).toContain('type=auth_callback')
  })

  it('cleans up oauth_state cookie on success', async () => {
    const token = fakeIdToken('user@elms.hokudai.ac.jp')
    mockCookieStore.get.mockReturnValue({ value: 'valid-csrf' })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: token }),
    }) as unknown as typeof fetch
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      },
      error: null,
    })
    const state = JSON.stringify({ csrf: 'valid-csrf', redirectTo: '/' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'good-code', state }))
    ) as MockRedirectResponse
    expect(res.cookies.delete).toHaveBeenCalledWith('oauth_state')
  })

  it('prevents open redirect in callback redirectTo', async () => {
    const token = fakeIdToken('user@elms.hokudai.ac.jp')
    mockCookieStore.get.mockReturnValue({ value: 'valid-csrf' })
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: token }),
    }) as unknown as typeof fetch
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        session: { access_token: 'at', refresh_token: 'rt', expires_in: 3600 },
      },
      error: null,
    })
    const state = JSON.stringify({ csrf: 'valid-csrf', redirectTo: '//evil.com' })
    const res = await callbackGet(
      new Request(callbackUrl({ code: 'good-code', state }))
    ) as MockRedirectResponse
    // Should fall back to / instead of //evil.com
    const urlPath = new URL(res.url).pathname
    expect(urlPath).toBe('/')
  })
})
