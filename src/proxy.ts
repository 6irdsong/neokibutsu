import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BOT_UA_PATTERNS = [
  'python-requests', 'scrapy', 'curl/', 'wget/', 'httpx', 'aiohttp',
  'go-http-client', 'java/', 'libwww-perl', 'mechanize', 'httpclient',
  'node-fetch', 'undici', 'axios/', 'got/', 'php/', 'ruby',
  'gptbot', 'ccbot', 'chatgpt', 'anthropic', 'claude-web', 'bytespider',
  'petalbot', 'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip bot check for static files and API routes
  if (pathname.startsWith('/_next/') || pathname.startsWith('/icon') || pathname.startsWith('/manifest')) {
    return NextResponse.next()
  }

  // Bot detection
  const ua = (request.headers.get('user-agent') || '').toLowerCase()
  if (BOT_UA_PATTERNS.some(p => ua.includes(p))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // www redirect
  const host = request.headers.get('host') || ''
  if (host === 'neokibutsu.net') {
    const url = request.nextUrl.clone()
    url.host = 'www.neokibutsu.net'
    return NextResponse.redirect(url, 301)
  }

  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')

  // noindex for admin/legal pages
  if (pathname.startsWith('/admin') || pathname === '/terms' || pathname === '/privacy') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
