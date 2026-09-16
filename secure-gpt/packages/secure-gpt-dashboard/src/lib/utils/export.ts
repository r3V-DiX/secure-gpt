// packages/dashboard/src/lib/utils/export.ts
// Authenticated CSV export — uses fetch with credentials so the session cookie
// is included. Falls back gracefully on error and shows a toast.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

/**
 * Download the current user's logs as a CSV file.
 * Uses fetch with credentials:include so the session cookie is sent.
 * Creates a temporary blob URL and clicks it — no page navigation.
 */
export async function downloadLogsCsv(filters: Record<string, string | number | undefined> = {}): Promise<void> {
    const url = new URL(`${BASE_URL}/api/v1/event-logs/export`)
    
    // Add filters as query params
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            url.searchParams.append(key, String(value))
        }
    })

    const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',   // ← sends the sgpt_session cookie
        headers: {
            // Send the same fingerprint header the Axios client sends
            'X-Client-Fingerprint': typeof window !== 'undefined'
                ? [navigator.platform, Intl.DateTimeFormat().resolvedOptions().timeZone, `${screen.width}x${screen.height}`].join('|')
                : '',
        },
    })

    if (!response.ok) {
        if (response.status === 401) {
            window.location.href = '/login'
            return
        }
        throw new Error(`Export failed: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    // Extract filename from Content-Disposition header if available
    const disposition = response.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename=([^\s;]+)/)
    const filename = match?.[1] ?? `dlp_logs_${new Date().toISOString().slice(0, 10)}.csv`

    // Trigger browser download without navigating away
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    // Clean up the blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
}

/**
 * Download authentication audit logs as a CSV file.
 */
export async function downloadAuditLogsCsv(): Promise<void> {
    const url = new URL(`${BASE_URL}/api/v1/admin/audit-logs/export`)

    const response = await fetch(url.toString(), {
        method: 'GET',
        credentials: 'include',
        headers: {
            'X-Client-Fingerprint': typeof window !== 'undefined'
                ? [navigator.platform, Intl.DateTimeFormat().resolvedOptions().timeZone, `${screen.width}x${screen.height}`].join('|')
                : '',
        },
    })

    if (!response.ok) {
        if (response.status === 401) {
            window.location.href = '/login'
            return
        }
        throw new Error(`Export failed: ${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const disposition = response.headers.get('Content-Disposition') ?? ''
    const match = disposition.match(/filename=([^\s;]+)/)
    const filename = match?.[1] ?? `system_auth_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`

    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000)
}