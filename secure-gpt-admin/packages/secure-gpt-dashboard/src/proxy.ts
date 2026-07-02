import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'sgpt_session'
const PUBLIC_PATHS = ['/callback', '/api', '/privacy']
const PUBLIC_EXACT = ['/']
const AUTH_PATHS = ['/login']
const PUBLIC_FILE_EXTENSIONS = /\.(png|svg|jpg|jpeg|ico|webp|json|webmanifest|txt|xml)$/

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_FILE_EXTENSIONS.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Allow landing page and other exact public routes
  if (PUBLIC_EXACT.includes(pathname)) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value

  if (session && AUTH_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!session && !AUTH_PATHS.some(p => pathname.startsWith(p))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
