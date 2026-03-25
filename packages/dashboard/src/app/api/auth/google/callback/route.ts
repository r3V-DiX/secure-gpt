// src/app/api/auth/google/callback/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import http from 'http'
import https from 'https'

function proxyToBackend(url: string, headers: Record<string, string>): Promise<{
    statusCode: number
    setCookie: string | null
}> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url)
        const lib = parsed.protocol === 'https:' ? https : http

        const req = lib.request(
            {
                hostname: parsed.hostname,
                port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
                path: parsed.pathname + parsed.search,
                method: 'GET',
                headers,
            },
            (res) => {
                res.resume()
                const setCookie = res.headers['set-cookie']?.[0] ?? null
                console.log('[OAuth] Backend status:', res.statusCode)
                console.log('[OAuth] Backend headers:', JSON.stringify(res.headers))
                resolve({ statusCode: res.statusCode ?? 0, setCookie })
            }
        )
        req.on('error', reject)
        req.end()
    })
}

export async function GET(request: NextRequest) {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'
    const backendCallbackUrl = `${backendUrl}/api/v1/auth/google/callback${request.nextUrl.search}`

    console.log('[OAuth] Proxying to:', backendCallbackUrl)

    let result: Awaited<ReturnType<typeof proxyToBackend>>
    try {
        result = await proxyToBackend(backendCallbackUrl, {
            'user-agent': request.headers.get('user-agent') ?? '',
            'accept-language': request.headers.get('accept-language') ?? '',
            'x-oauth-callback': 'true',
        })
    } catch (err) {
        console.error('[OAuth] Backend unreachable:', err)
        return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    if (!result.setCookie) {
        console.error('[OAuth] No set-cookie in backend response')
        return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }

    // Parse the set-cookie string
    const parts = result.setCookie.split(';').map(p => p.trim())
    const firstPart = parts[0] ?? ''
    const eqIdx = firstPart.indexOf('=')
    const name = firstPart.slice(0, eqIdx).trim()
    const value = firstPart.slice(eqIdx + 1).trim()
    const attrs: Record<string, string> = {}
    for (const part of parts.slice(1)) {
        const [k, v] = part.split('=')
        if (k !== undefined) {
            attrs[k.toLowerCase().trim()] = (v ?? '').trim()
        }
    }

    console.log('[OAuth] Planting cookie:', name, value.slice(0, 8) + '...')

    const response = NextResponse.redirect(new URL('/callback', request.url))
    response.cookies.set({
        name,
        value,
        maxAge: attrs['max-age'] ? parseInt(attrs['max-age']) : 86400,
        path: attrs['path'] ?? '/',
        httpOnly: 'httponly' in attrs,
        secure: 'secure' in attrs,
        sameSite: (attrs['samesite']?.toLowerCase() as 'lax' | 'strict' | 'none') ?? 'lax',
    })

    console.log('[OAuth] Done ✓')
    return response
}