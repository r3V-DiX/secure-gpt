'use client'

import React from 'react'
import { Building2, ArrowRight, RefreshCw } from 'lucide-react'

interface OrgProfileStepProps {
  orgName: string
  setOrgName: (val: string) => void
  orgDomain: string
  setOrgDomain: (val: string) => void
  adminEmail: string
  setAdminEmail: (val: string) => void
  isExistingOrg: boolean
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function OrgProfileStep({
  orgName,
  setOrgName,
  orgDomain,
  setOrgDomain,
  adminEmail,
  setAdminEmail,
  isExistingOrg,
  submitting,
  onSubmit,
}: OrgProfileStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-[var(--accent)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Step 1: Organization Details
          </h2>
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Provide your official corporate company name and domain. This anchors all team memberships and DLP telemetry.
        </p>
      </div>

      <div className="space-y-4 pt-1">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
            Company / Organization Name <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)]"
            style={{
              background: 'var(--bg-base)',
              borderColor: 'var(--border)',
            }}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
            Primary Corporate Domain <span className="text-[var(--danger)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-tertiary)]">
              https://
            </span>
            <input
              type="text"
              value={orgDomain}
              onChange={(e) => setOrgDomain(e.target.value.toLowerCase().replace(/https?:\/\//, ''))}
              placeholder="acmecorp.com"
              disabled={isExistingOrg}
              className="w-full pl-20 pr-3.5 py-2.5 rounded-xl border text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] disabled:opacity-60"
              style={{
                background: 'var(--bg-base)',
                borderColor: 'var(--border)',
              }}
              required
            />
          </div>
          <span className="block mt-1 text-[11px] text-[var(--text-tertiary)]">
            Public email domains (gmail.com, yahoo.com) are disallowed. Must match corporate email.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
            Admin Contact Email <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="security@acmecorp.com"
            disabled={isExistingOrg}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-border)] disabled:opacity-60"
            style={{
              background: 'var(--bg-base)',
              borderColor: 'var(--border)',
            }}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs text-[var(--text-tertiary)]">
          Next: DNS TXT domain challenge
        </span>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
        >
          {submitting ? <RefreshCw className="size-3.5 animate-spin" /> : null}
          <span>Save & Continue</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </form>
  )
}
