'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal/modal'
import { Button, Input } from '@/components/ui'
import { ShieldAlert, Snowflake, AlertTriangle, Loader2 } from 'lucide-react'
import { AdminOrgItem } from './OrgTableRow'

interface FreezeOrgModalProps {
  isOpen: boolean
  org: AdminOrgItem | null
  onClose: () => void
  onConfirmFreeze: (orgId: string, confirmation: string) => Promise<void>
}

export function FreezeOrgModal({
  isOpen,
  org,
  onClose,
  onConfirmFreeze,
}: FreezeOrgModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!org) return null

  const orgName = org.name || 'Organization'
  const isMatch =
    confirmationInput.trim().toUpperCase() === 'FREEZE' ||
    confirmationInput.trim().toLowerCase() === orgName.toLowerCase()

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    if (!org || !isMatch) return

    setSubmitting(true)
    setError(null)
    try {
      await onConfirmFreeze(org.id, confirmationInput.trim())
      setConfirmationInput('')
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Emergency freeze operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        if (!submitting) {
          setConfirmationInput('')
          setError(null)
          onClose()
        }
      }}
      size="md"
    >
      <form onSubmit={handleConfirm} className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <Snowflake size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Emergency Killswitch: Freeze Organization
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Target Tenant: <strong className="text-[var(--text-primary)]">{orgName}</strong> ({org.domain || 'no domain'})
            </p>
          </div>
        </div>

        {/* Warning callout */}
        <div className="p-3.5 rounded-xl bg-[var(--danger-light)] border border-[var(--danger-border)] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[var(--danger)]">
            <AlertTriangle size={15} />
            <span>High Impact Administrative Action</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            <li>Immediately revokes all active web dashboard sessions for all <strong className="text-[var(--text-primary)]">{org.user_count}</strong> tenant users.</li>
            <li>Blocks employee and admin logins until manually reactivated.</li>
            <li>Broadcasts an emergency policy signal to employee browser extensions to pause inspection.</li>
          </ul>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-[var(--danger-light)] border border-[var(--danger-border)] text-[var(--danger)] text-xs font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="freeze-confirm-input"
            className="block text-xs font-semibold text-[var(--text-primary)]"
          >
            To confirm, type <span className="font-mono text-[var(--danger)] font-bold">FREEZE</span> or <span className="font-mono text-[var(--text-primary)] font-bold">{orgName}</span> below:
          </label>
          <Input
            id="freeze-confirm-input"
            type="text"
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            disabled={submitting}
            placeholder={`Type "FREEZE" or "${orgName}"`}
            autoComplete="off"
            className="font-mono focus:border-[var(--danger)]"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            type="submit"
            disabled={!isMatch || submitting}
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Executing Killswitch…</span>
              </>
            ) : (
              <>
                <ShieldAlert size={15} />
                <span>Execute Emergency Freeze</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
