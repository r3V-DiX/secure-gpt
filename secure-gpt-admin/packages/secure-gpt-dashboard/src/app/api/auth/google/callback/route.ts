// packages/dashboard/src/app/api/auth/google/callback/route.ts

import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
  const appUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  // Forward the OAuth code/error params to the backend callback
  const backendCallbackUrl = `${backendUrl}/api/v1/auth/google/callback${request.nextUrl.search}`

  console.log('[OAuth] Proxying to:', backendCallbackUrl)
  console.log('[OAuth] App URL:', appUrl)

  let backendRes: Response
  try {
    backendRes = await fetch(backendCallbackUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'user-agent': request.headers.get('user-agent') ?? '',
        'accept-language': request.headers.get('accept-language') ?? '',
        'x-oauth-callback': 'true',
      },
    })
  } catch (err) {
    console.error('[OAuth] Backend unreachable:', err)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl))
  }

  console.log('[OAuth] Backend status:', backendRes.status)
  console.log('[OAuth] Backend set-cookie:', backendRes.headers.get('set-cookie'))

  if (backendRes.status !== 302 && backendRes.status !== 200) {
    console.error('[OAuth] Unexpected backend status:', backendRes.status)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', appUrl))
  }

  const rawCookie = backendRes.headers.get('set-cookie')

  if (!rawCookie) {
    console.error('[OAuth] No set-cookie in backend response')
    return NextResponse.redirect(new URL('/callback', appUrl))
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

  console.log('[OAuth] Planting cookie — name:', name, 'value:', value.slice(0, 8) + '...')

  const response = NextResponse.redirect(new URL('/callback', appUrl))
  response.cookies.set({
    name,
    value,
    maxAge: attrs['max-age'] ? parseInt(attrs['max-age']) : 86400,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })

  console.log('[OAuth] Done ✓ — cookie planted, redirecting to /callback')
  return response
}