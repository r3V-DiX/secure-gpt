// packages/dashboard/src/lib/env.ts
// API_URL must point to the Next.js proxy, NOT the backend directly.
// This ensures the session cookie is always set on localhost:3000
// and sent back on every request — no cross-origin cookie issues.
//
// Next.js rewrites /api/v1/* → backend:8000/api/v1/* server-side,
// so the browser never talks to :8000 directly.

const getApiUrl = (): string => {
  // In the browser — use empty string (relative URL, same origin as page)
  // e.g. baseURL becomes '' so axios calls /api/v1/auth/me on localhost:3000
  if (typeof window !== 'undefined') {
    return ''
  }

  // Server-side (SSR) — must be absolute
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[env] NEXT_PUBLIC_API_URL is not set. ' +
        'Add it to your deployment environment variables.'
      )
    }
    return 'http://localhost:3000'
  }

  return url.replace(/\/$/, '')
}

export const API_URL = getApiUrl()