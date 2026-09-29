'use client'

import { Input, Button } from '@/components/ui'
import { Zap } from 'lucide-react'

interface DevQuickBypassProps {
  devEmail: string
  setDevEmail: (val: string) => void
  devLoading: boolean
  privacyAccepted: boolean
  onDevLogin: (e: React.FormEvent) => Promise<void>
}

export function DevQuickBypass({
  devEmail,
  setDevEmail,
  devLoading,
  privacyAccepted,
  onDevLogin,
}: DevQuickBypassProps) {
  return (
    <form
      onSubmit={onDevLogin}
      className="mt-5 pt-5 border-t space-y-2.5"
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

      <div className="flex gap-2">
        <Input aria-label="Test email..." controlSize="lg" wrapperClassName="w-auto min-w-0"
          type="email"
          placeholder="Test email..."
          value={devEmail}
          onChange={(e) => setDevEmail(e.target.value)}
          required
          className="flex-1"

        />
        <Button variant="primary"
          type="submit"
          disabled={devLoading || !devEmail || !privacyAccepted}
          className="shrink-0"
        >
          {devLoading ? 'Entering...' : 'Instant Login'}
        </Button>
      </div>
    </form>
  )
}
