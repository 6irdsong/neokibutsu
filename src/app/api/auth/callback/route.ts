import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const ALLOWED_DOMAINS = ['elms.hokudai.ac.jp']

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error || !code || !stateParam) {
    return NextResponse.redirect(new URL('/?auth_error=cancelled', url.origin))
  }

  // Verify CSRF
  let parsed: { csrf: string; redirectTo: string }
  try {
    parsed = JSON.parse(stateParam)
  } catch {
    return NextResponse.redirect(new URL('/?auth_error=invalid_state', url.origin))
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value

  if (!storedState || storedState !== parsed.csrf) {
    return NextResponse.redirect(new URL('/?auth_error=csrf_mismatch', url.origin))
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?auth_error=token_exchange_failed', url.origin))
  }

  const tokens = await tokenRes.json()
  const idToken: string = tokens.id_token

  if (!idToken) {
    return NextResponse.redirect(new URL('/?auth_error=no_id_token', url.origin))
  }

  // Verify domain from ID token
  try {
    const b64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString())
    const email: string = payload.email || ''
    const domain = email.split('@')[1] || ''
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.redirect(new URL('/?auth_error=invalid_domain', url.origin))
    }
  } catch {
    return NextResponse.redirect(new URL('/?auth_error=token_decode_failed', url.origin))
  }

  // Sign in with Supabase using the ID token
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  })

  if (signInError || !data.session) {
    return NextResponse.redirect(new URL('/?auth_error=supabase_signin_failed', url.origin))
  }

  // Pass session to client via URL fragment (not sent to server)
  // Note: ID token signature is verified by Google's HTTPS endpoint (code→token exchange),
  // so additional JWT signature verification is unnecessary here.
  const rawRedirect = parsed.redirectTo || '/'
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/'
  const fragment = new URLSearchParams({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token!,
    expires_in: String(data.session.expires_in),
    token_type: 'bearer',
    type: 'auth_callback',
  }).toString()

  const response = NextResponse.redirect(
    new URL(`${redirectTo}#${fragment}`, url.origin)
  )

  // Clean up oauth state cookie
  response.cookies.delete('oauth_state')

  return response
}
