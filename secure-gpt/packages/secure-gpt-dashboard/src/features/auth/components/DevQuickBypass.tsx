'use client'

import React from 'react'
import { Input, Button } from '@/components/ui'
import { Zap, ShieldAlert } from 'lucide-react'

interface DevQuickBypassProps {
  devEmail: string
  setDevEmail: (val: string) => void
  devLoading: boolean
  privacyAccepted: boolean
  onDevLogin: (e: React.FormEvent, customEmail?: string, customPersona?: string) => Promise<void>
  isAdminMode?: boolean
}

export function DevQuickBypass({
  devEmail,
  setDevEmail,
  devLoading,
  privacyAccepted,
  onDevLogin,
  isAdminMode,
}: DevQuickBypassProps) {
  return (
    <div
      className="mt-5 pt-5 border-t space-y-3"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <Zap size={13} className="fill-current" /> Developer Quick-Bypass
        </p>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
          dev-mode
        </span>
      </div>

      {/* 1-Click Super Admin Bypass */}
      <Button
        variant="danger"
        type="button"
        disabled={devLoading || !privacyAccepted}
        onClick={(e) => onDevLogin(e, 'superadmin@blackvector.online', 'super_admin')}
        className="w-full h-9 flex items-center justify-center gap-2 text-xs font-semibold"
      >
        <ShieldAlert size={14} />
        <span>Instant Login as Super Admin</span>
      </Button>

      <form onSubmit={(e) => onDevLogin(e)} className="flex gap-2">
        <Input
          aria-label="Test email..."
          controlSize="lg"
          wrapperClassName="w-auto min-w-0"
          type="email"
          placeholder={isAdminMode ? 'superadmin@blackvector.online' : 'Test email...'}
          value={devEmail}
          onChange={(e) => setDevEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button
          variant="primary"
          type="submit"
          disabled={devLoading || !devEmail || !privacyAccepted}
          className="shrink-0"
        >
          {devLoading ? 'Entering...' : 'Instant Login'}
        </Button>
      </form>
    </div>
  )
}
