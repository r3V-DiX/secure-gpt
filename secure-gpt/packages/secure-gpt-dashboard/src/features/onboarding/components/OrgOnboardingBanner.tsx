'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowRight, X, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { apiGet } from '@/lib/api/client'

interface OrgCurrentResponse {
  id: string
  name: string
  domain: string | null
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED'
  domain_verified_at: string | null
  dns_txt_token: string | null
}

export function OrgOnboardingBanner() {
  const { user } = useAuth()
  const [org, setOrg] = useState<OrgCurrentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only fetch for org admins or users who might have an org
    if (!user || user.role === 'super_admin' || user.role === 'platform_super_admin') {
      setLoading(false)
      return
    }

    let isMounted = true
    async function fetchOrg() {
      try {
        const res = await apiGet<OrgCurrentResponse | null>('/orgs/current')
        if (isMounted && res) {
          setOrg(res)
        }
      } catch (err) {
        // Not fatal, silent catch
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchOrg()
    return () => {
      isMounted = false
    }
  }, [user])

  if (loading || dismissed || !org) return null

  // If organization is already fully active and domain verified, don't show the setup warning
  if (org.status === 'ACTIVE' && org.domain_verified_at) {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 md:p-5 mb-6 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 dark:text-amber-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-bold text-[var(--text-primary)]">
                Complete Enterprise Organization Setup
              </h4>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Action Required
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Your organization <strong className="text-[var(--text-primary)] font-semibold">{org.name}</strong> ({org.domain || 'pending domain'}) requires DNS TXT verification before employee auto-enrollment and enterprise policy presets can be enforced.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end">
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-sm shadow-[var(--accent)]/20"
          >
            <span>Complete Setup</span>
            <ArrowRight size={15} />
          </Link>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] rounded-xl transition-colors"
            title="Dismiss for this session"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
