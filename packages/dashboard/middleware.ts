// middleware.ts
// Session-based auth guard.
// Backend sets `sgpt_session` httpOnly cookie on login.
// We just check its presence here — real validation happens on the backend.
// No JWT decoding needed since there's no JWT.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'sgpt_session'

// Routes that don't require auth
const PUBLIC_PATHS = ['/login', '/callback', '/api']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow Next.js internals + static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(png|svg|jpg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Check session cookie presence
  const session = request.cookies.get(SESSION_COOKIE)?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    // Preserve intended destination so we can redirect back after login
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}