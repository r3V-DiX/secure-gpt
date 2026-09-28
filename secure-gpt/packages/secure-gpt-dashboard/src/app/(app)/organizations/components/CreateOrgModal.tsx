'use client'

import React from 'react'
import { Building2, X, RefreshCw } from 'lucide-react'

interface CreateOrgModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  name: string
  setName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  domain: string
  setDomain: (v: string) => void
  preVerify: boolean
  setPreVerify: (v: boolean) => void
  submitting: boolean
}

export function CreateOrgModal({
  open,
  onClose,
  onSubmit,
  name,
  setName,
  email,
  setEmail,
  domain,
  setDomain,
  preVerify,
  setPreVerify,
  submitting,
}: CreateOrgModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-6 md:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)] font-bold">
              <Building2 size={17} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Register Enterprise Organization
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-[var(--text-primary)] mb-1">
              Organization Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[var(--text-primary)] mb-1">
              Admin Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (!domain && e.target.value.includes('@')) {
                  setDomain(e.target.value.split('@')[1] || '')
                }
              }}
              placeholder="admin@acme.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[var(--text-primary)] mb-1">
              Corporate Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value.toLowerCase())}
              placeholder="acme.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-[13.5px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="pre_verify_checkbox"
              checked={preVerify}
              onChange={(e) => setPreVerify(e.target.checked)}
              className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <label htmlFor="pre_verify_checkbox" className="text-[13px] text-[var(--text-secondary)] select-none">
              Pre-verify domain ownership (Bypass DNS challenge)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-[13.5px] hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <RefreshCw size={15} className="animate-spin" /> : null}
              <span>Create Organization</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
