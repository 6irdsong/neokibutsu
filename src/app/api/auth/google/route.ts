import { NextResponse } from 'next/server'
import crypto from 'crypto'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawRedirect = searchParams.get('redirectTo') || '/'
  // Prevent open redirect: must start with / and not //
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/'

  // CSRF protection
  const state = crypto.randomBytes(32).toString('hex')
  const origin = new URL(request.url).origin

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state: JSON.stringify({ csrf: state, redirectTo }),
    hd: 'elms.hokudai.ac.jp',
    prompt: 'select_account',
  })

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )

  // Store CSRF token in httpOnly cookie
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
