import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'sgpt_session'
const PUBLIC_PATHS = ['/callback', '/api']
const AUTH_PATHS = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[Middleware] Request:', pathname)

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|svg|jpg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    console.log('[Middleware] Public path, skipping:', pathname)
    return NextResponse.next()
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value
  console.log('[Middleware] Session cookie:', session ? `EXISTS (${session.substring(0, 10)}...)` : 'NOT FOUND')
  console.log('[Middleware] All cookies:', request.cookies.getAll().map(c => c.name))

  if (session && AUTH_PATHS.some(p => pathname.startsWith(p))) {
    console.log('[Middleware] Logged in user on auth page → redirecting to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session && !AUTH_PATHS.some(p => pathname.startsWith(p))) {
    console.log('[Middleware] No session on protected route → redirecting to /login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('[Middleware] Passing through:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}