'use client'

import { IconButton } from '@/components/ui'
import { Button } from '@/components/ui'
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
    <div className="relative overflow-hidden rounded-md border border-amber-500/30 bg-amber-500/5 p-4 mb-6 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-500 dark:text-amber-400">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[13.5px] font-bold text-[var(--text-primary)]">
                Complete Enterprise Organization Setup
              </h4>
              <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Action Required
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Your organization <strong className="text-[var(--text-primary)] font-semibold">{org.name}</strong> ({org.domain || 'pending domain'}) requires DNS TXT verification before employee auto-enrollment and enterprise policy presets can be enforced.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <Link
            href="/onboarding"
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-90 transition-all shadow-xs"
          >
            <span>Complete Setup</span>
            <ArrowRight size={14} />
          </Link>

          <IconButton aria-label="Dismiss for this session" variant="ghost"
            type="button"
            onClick={() => setDismissed(true)}

            title="Dismiss for this session"
          >
            <X size={15} />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
