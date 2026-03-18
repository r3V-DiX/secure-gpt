import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/callback', '/google']

// Role-based route access
const ROLE_ROUTES: Record<string, string[]> = {
  '/super-admin': ['SUPER_ADMIN'],
  '/security-admin': ['SUPER_ADMIN', 'SECURITY_ADMIN'],
  '/auditor': ['SUPER_ADMIN', 'SECURITY_ADMIN', 'AUDITOR'],
  '/user': ['SUPER_ADMIN', 'SECURITY_ADMIN', 'AUDITOR', 'HR_MANAGER', 'USER'],
}

function decodeJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Payload = token.split('.')[1]
    if (!base64Payload) return null
    const decoded = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Check for token in cookies (set during login)
  const token = request.cookies.get('access_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Decode token to check role
  const payload = decodeJWTPayload(token)
  if (!payload || !payload.role) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const userRole = payload.role as string

  // Check role-based access
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        const roleHome: Record<string, string> = {
          SUPER_ADMIN: '/super-admin/dashboard',
          SECURITY_ADMIN: '/security-admin/dashboard',
          AUDITOR: '/auditor/dashboard',
          HR_MANAGER: '/security-admin/dashboard',
          USER: '/user/dashboard',
        }
        return NextResponse.redirect(new URL(roleHome[userRole] ?? '/login', request.url))
      }
      break
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)',
  ],
}
