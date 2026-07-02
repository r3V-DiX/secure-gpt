// Dashboard proxy for the SSE policy stream.
//
// Next.js rewrites() buffers responses and breaks SSE. A Route Handler at the
// exact path takes precedence over rewrites and can pipe the body through as a
// raw ReadableStream — no buffering, no transformation.

import { type NextRequest } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const backendRes = await fetch(
    `${BACKEND_URL}/api/v1/extension/policy/stream`,
    {
      headers: {
        // Forward the session cookie so backend auth works
        cookie: request.headers.get('cookie') ?? '',
        'x-extension-request': request.headers.get('x-extension-request') ?? '',
        accept: 'text/event-stream',
      },
      // Keep the connection open — do not let Next's default timeout close it
      signal: request.signal,
    }
  )

  if (!backendRes.ok || !backendRes.body) {
    return new Response('SSE upstream unavailable', { status: 502 })
  }

  return new Response(backendRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
