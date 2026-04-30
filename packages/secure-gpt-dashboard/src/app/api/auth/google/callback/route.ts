// packages/dashboard/src/app/api/auth/google/callback/route.ts
//
// FIX: The backend was redirecting the browser directly to localhost:3000/callback
// with set-cookie — but that cookie gets attributed to localhost:8000 (backend),
// not localhost:3000 (dashboard). Middleware on localhost:3000 never sees it.
//
// This proxy now:
// 1. Tells the backend its redirect_uri is THIS route (localhost:3000/api/auth/google/callback)
// 2. Intercepts the backend response before the browser ever sees it
// 3. Re-plants the cookie on localhost:3000 explicitly
// 4. Then redirects browser to /callback
//
// The backend's GOOGLE_REDIRECT_URI must be:
// http://localhost:3000/api/auth/google/callback  ← already correct in  .env

import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

  // Forward the OAuth code/error params to the backend callback
  const backendCallbackUrl = `${backendUrl}/api/v1/auth/google/callback${request.nextUrl.search}`

  console.log('[OAuth] Proxying to:', backendCallbackUrl)

  let backendRes: Response
  try {
    backendRes = await fetch(backendCallbackUrl, {
      method: 'GET',
      redirect: 'manual', // ← CRITICAL: don't follow redirects, we need the set-cookie header
      headers: {
        'user-agent': request.headers.get('user-agent') ?? '',
        'accept-language': request.headers.get('accept-language') ?? '',
        'x-oauth-callback': 'true',
      },
    })
  } catch (err) {
    console.error('[OAuth] Backend unreachable:', err)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }

  console.log('[OAuth] Backend status:', backendRes.status)
  console.log('[OAuth] Backend set-cookie:', backendRes.headers.get('set-cookie'))

  // Backend should return 302 with set-cookie
  if (backendRes.status !== 302 && backendRes.status !== 200) {
    console.error('[OAuth] Unexpected backend status:', backendRes.status)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
  }

  const rawCookie = backendRes.headers.get('set-cookie')

  if (!rawCookie) {
    console.error('[OAuth] No set-cookie in backend response — cookie may already be set via redirect')
    // Backend might have redirected directly with cookie — just go to /callback
    return NextResponse.redirect(new URL('/callback', request.url))
  }

  // Parse the set-cookie string robustly
  const parts = rawCookie.split(';').map(p => p.trim())
  const [cookiePair, ...attrParts] = parts
  const eqIdx = cookiePair.indexOf('=')
  const name = cookiePair.slice(0, eqIdx).trim()
  const value = cookiePair.slice(eqIdx + 1).trim()

  const attrs: Record<string, string> = {}
  for (const part of attrParts) {
    const eqPos = part.indexOf('=')
    const k = (eqPos === -1 ? part : part.slice(0, eqPos)).toLowerCase().trim()
    const v = eqPos === -1 ? '' : part.slice(eqPos + 1).trim()
    attrs[k] = v
  }

  console.log('[OAuth] Planting cookie on localhost:3000 — name:', name, 'value:', value.slice(0, 8) + '...')

  // Plant the cookie on localhost:3000 (Next.js dashboard origin)
  // This is the key fix — middleware will now see this cookie
  const response = NextResponse.redirect(new URL('/callback', request.url))
  response.cookies.set({
    name,
    value,
    maxAge: attrs['max-age'] ? parseInt(attrs['max-age']) : 86400,
    path: '/',
    httpOnly: true,
    secure: false, // false in dev — middleware can read it
    sameSite: 'lax',
  })

  console.log('[OAuth] Done ✓ — cookie planted on dashboard origin')
  return response
}