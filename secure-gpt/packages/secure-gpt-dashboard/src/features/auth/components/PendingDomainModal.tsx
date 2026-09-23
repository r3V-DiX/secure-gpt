'use client'

import React from 'react'
import { Building2, AlertTriangle, ArrowRight, UserCheck, Clock } from 'lucide-react'

interface PendingDomainModalProps {
  orgName: string
  domain: string
  onContinuePersonal: () => void
  onCancel: () => void
  loading: boolean
}

export function PendingDomainModal({
  orgName,
  domain,
  onContinuePersonal,
  onCancel,
  loading,
}: PendingDomainModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-lg border p-6 shadow-2xl relative animate-scale-in"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Domain Verification Pending
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Organization: <strong className="text-[var(--text-primary)]">{orgName}</strong> ({domain})
            </p>
          </div>
        </div>

        <div
          className="p-3.5 rounded-xl border text-xs leading-relaxed mb-5"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <p>
            Your organization administrator has registered <strong>{domain}</strong>, but domain ownership DNS verification is still in progress.
          </p>
          <p className="mt-2 text-[var(--text-primary)] font-medium">
            You can create a <strong>Personal Account</strong> today. Once your administrator completes DNS verification, your account will be automatically migrated to an employee account.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onContinuePersonal}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-md"
            style={{ background: 'var(--accent)' }}
          >
            <UserCheck size={14} />
            <span>{loading ? 'Setting up account…' : 'Continue with Personal Account'}</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all hover:bg-[var(--bg-surface-2)] flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              background: 'transparent',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Clock size={13} />
            <span>Wait for Org Administrator</span>
          </button>
        </div>
      </div>
    </div>
  )
}
