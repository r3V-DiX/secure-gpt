'use client'

import React, { useState } from 'react'
import { Eye, LogOut, Loader2, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { apiPost } from '@/lib/api/client'
import { Button } from '@/components/ui'

export function ImpersonationBanner() {
  const { user } = useAuth()
  const [exiting, setExiting] = useState(false)
  const [exitError, setExitError] = useState<string | null>(null)

  if (!user?.is_impersonation) {
    return null
  }

  const orgName = user.impersonated_org?.name || 'Tenant Organization'

  async function handleExit() {
    setExitError(null)
    setExiting(true)
    try {
      await apiPost('/auth/impersonate/exit')
      const adminConsoleUrl =
        process.env.NODE_ENV === 'production'
          ? 'https://admin.securegpt.rkavach.com/organizations'
          : 'http://localhost:3001/organizations'
      window.location.href = adminConsoleUrl
    } catch (error) {
      setExitError(error instanceof Error ? error.message : 'Unable to exit impersonation')
      setExiting(false)
    }
  }

  return (
    <aside
      aria-label="Tenant Impersonation Notice"
      style={{
        background: 'var(--warning)',
        borderBottom: '1px solid var(--warning-border)',
        color: 'var(--text-primary)',
      }}
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-[13px] font-medium transition-all shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span
          style={{ background: 'var(--warning-border)', color: 'var(--text-primary)' }}
          className="flex size-6 shrink-0 items-center justify-center rounded-md"
        >
          <Eye size={14} />
        </span>
        <span>
          <strong style={{ color: 'var(--text-primary)' }} className="font-semibold">
            Impersonating Workspace:
          </strong>{' '}
          <span className="underline underline-offset-2" style={{ textDecorationColor: 'var(--text-secondary)' }}>
            {orgName}
          </span>
          {' '}&bull;{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Read-Only Mode (All mutations disabled)</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span
          style={{ color: 'var(--text-secondary)' }}
          className="hidden md:inline-flex items-center gap-1 text-[11px]"
        >
          <ShieldAlert size={12} />
          Super Admin Session
        </span>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={handleExit}
          disabled={exiting}
        >
          {exiting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Exiting…</span>
            </>
          ) : (
            <>
              <LogOut size={13} />
              <span>Exit Impersonation</span>
            </>
          )}
        </Button>
        {exitError && <span role="alert" className="text-xs text-[var(--danger)]">{exitError}</span>}
      </div>
    </aside>
  )
}
