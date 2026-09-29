'use client'

import { Badge, Card } from '@/components/ui'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { PartyPopper } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/features/profile/hooks/use-profile'
import {
  getChecklistForRole,
  resolveChecklistRole,
  type ChecklistRole,
} from '@/features/onboarding/config/steps.data'
import { StepCard } from '@/features/onboarding/components/StepCard'
import { apiGet } from '@/lib/api/client'

const IS_ADMIN_MODE = process.env.NEXT_PUBLIC_APP_MODE === 'admin'

interface OrgCurrentResponse {
  id: string
  name: string
  domain: string | null
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED'
  domain_verified_at: string | null
}

export default function GetStartedPage() {
  const { user } = useAuth()
  const { devices, loading: devicesLoading } = useProfile()
  const [org, setOrg] = useState<OrgCurrentResponse | null>(null)
  const [manualDone, setManualDone] = useState<string[]>([])

  const currentRole: ChecklistRole = useMemo(
    () => resolveChecklistRole(user, IS_ADMIN_MODE),
    [user]
  )

  const { title, subtitle, steps: activeSteps } = useMemo(
    () => getChecklistForRole(currentRole),
    [currentRole]
  )

  const storageKey = user?.id
    ? `securegpt:get-started:done:${currentRole}:${user.id}`
    : `securegpt:get-started:done:${currentRole}`

  useEffect(() => {
    let isMounted = true
    async function loadOrg() {
      if (currentRole !== 'org_admin') {
        return
      }
      try {
        const res = await apiGet<OrgCurrentResponse | null>('/orgs/current')
        if (isMounted && res) {
          setOrg(res)
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadOrg()
    return () => {
      isMounted = false
    }
  }, [currentRole])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        setManualDone(JSON.parse(raw))
      } else {
        setManualDone([])
      }
    } catch {
      setManualDone([])
    }
  }, [storageKey])

  function isStepDone(stepId: string): boolean {
    if (stepId === 'verify_domain') {
      if (org?.domain_verified_at) return true
    }
    if (stepId === 'install' || stepId === 'connect') {
      if (!devicesLoading && devices.length > 0) return true
    }
    return manualDone.includes(stepId)
  }

  function toggleManualStep(stepId: string) {
    setManualDone((prev) => {
      const next = prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // Ignore localStorage quota errors
      }
      return next
    })
  }

  const completed = activeSteps.filter((s) => isStepDone(s.id)).length
  const pct = Math.round((completed / activeSteps.length) * 100)
  const allDone = completed === activeSteps.length

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <Badge variant="info"
              className="uppercase"

            >
              {currentRole.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        </div>

        {currentRole !== 'super_admin' && (
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md border text-xs font-semibold shrink-0"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{
                background: devicesLoading ? 'var(--text-tertiary)' : devices.length > 0 ? 'var(--success)' : 'var(--warning)',
              }}
            />
            {devicesLoading
              ? 'Checking connection…'
              : devices.length > 0
              ? `${devices.length} device${devices.length === 1 ? '' : 's'} connected`
              : 'No device connected yet'}
          </div>
        )}
      </div>

      {/* ── Progress card ───────────────────────────────────────────────── */}
      <Card className="p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
              Setup progress
            </span>
            {allDone && (
              <Badge variant="success"


              >
                Complete
              </Badge>
            )}
          </div>
          <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {completed}/{activeSteps.length} steps
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-3)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: allDone
                ? 'linear-gradient(90deg, var(--success) 0%, #34d399 100%)'
                : 'linear-gradient(90deg, var(--accent) 0%, #818cf8 100%)',
            }}
          />
        </div>
        <p className="text-xs mt-2.5" style={{ color: 'var(--text-tertiary)' }}>
          {allDone
            ? 'Everything is set up. You’re ready to proceed!'
            : 'Track real-time setup progress or toggle steps once configured.'}
        </p>
      </Card>

      {/* ── Step cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {activeSteps.map((step, i) => {
          const isDone = isStepDone(step.id)
          const isAutoVerified =
            Boolean(step.autoDetectable) &&
            ((step.id === 'verify_domain' && isDone) ||
              ((step.id === 'install' || step.id === 'connect') && devices.length > 0))

          return (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              isDone={isDone}
              isAutoVerified={isAutoVerified}
              onToggle={toggleManualStep}
            />
          )
        })}
      </div>

      {/* ── Completion banner ───────────────────────────────────────────── */}
      {allDone && (
        <div
          className="rounded-md border p-6 flex flex-col sm:flex-row items-center gap-4 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, var(--success-light) 0%, var(--bg-surface) 60%)',
            borderColor: 'var(--success-border)',
          }}
        >
          <div
            className="size-12 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: 'var(--success-light)',
              border: '1.5px solid var(--success-border)',
              color: 'var(--success)',
            }}
          >
            <PartyPopper size={22} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              You're all set!
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {currentRole === 'super_admin'
                ? 'Platform setup verification complete. Proceed to the Global Console.'
                : 'Your setup is complete and your AI interactions are protected.'}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={currentRole === 'super_admin' ? '/organizations' : '/event-logs'}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-2)',
                color: 'var(--text-primary)',
              }}
            >
              {currentRole === 'super_admin' ? 'Organizations' : 'View Event Log'}
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: 'var(--success)',
                boxShadow: '0 2px 8px var(--success-glow)',
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
