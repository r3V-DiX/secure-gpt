'use client'

import { useState } from 'react'
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { OrgOnboardingBanner } from '@/features/onboarding/components/OrgOnboardingBanner'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { OnboardingBanner } from '@/features/dashboard/components/OnboardingBanner'
import { KpiCardsRow } from '@/features/dashboard/components/KpiCardsRow'
import { OrgLeaderboards } from '@/features/dashboard/components/OrgLeaderboards'
import { TelemetryGrids } from '@/features/dashboard/components/TelemetryGrids'
import { QuickStatsRow } from '@/features/dashboard/components/QuickStatsRow'

const ONBOARDING_DISMISS_KEY = 'securegpt:onboarding:dismissed'

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, loading, error } = useDashboard(30)
  const { devices, loading: devicesLoading } = useProfile()
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(ONBOARDING_DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const showOnboarding = !devicesLoading && devices.length === 0 && !onboardingDismissed

  function dismissOnboarding() {
    setOnboardingDismissed(true)
    try {
      localStorage.setItem(ONBOARDING_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'platform_super_admin' || process.env.NEXT_PUBLIC_APP_MODE === 'admin'
  const isOrgAdmin = ['org_admin', 'employer', 'security_admin', 'admin'].includes((user?.role || '').toLowerCase())

  const showTopEmployees = !isSuperAdmin && Boolean(user?.orgId) && isOrgAdmin && Boolean(stats?.topEmployees && stats.topEmployees.length > 0)
  const showTopDepartments = !isSuperAdmin && Boolean(user?.orgId) && Boolean(stats?.topDepartments && stats.topDepartments.length > 0)

  return (
    <div className="w-full space-y-7 animate-fade-in pb-8">
      {/* ── Enterprise Organization Setup Reminder Banner ──────────── */}
      <OrgOnboardingBanner />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <DashboardHeader
        greeting={greeting}
        firstName={firstName}
        isSuperAdmin={isSuperAdmin}
      />

      {/* ── Onboarding banner (extension not connected) ──────────────────── */}
      <OnboardingBanner
        show={showOnboarding}
        onDismiss={dismissOnboarding}
      />

      {error && (
        <div
          className="p-4 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <KpiCardsRow stats={stats} loading={loading} />

      {/* ── Organization Leaderboards ───────────────────────────────────── */}
      <OrgLeaderboards
        isSuperAdmin={isSuperAdmin}
        showTopEmployees={showTopEmployees}
        showTopDepartments={showTopDepartments}
        stats={stats}
        loading={loading}
      />

      {/* ── Telemetry Grids (Entities, Domains, Over Time) ─────────────── */}
      <TelemetryGrids stats={stats} loading={loading} />

      {/* ── Quick Stats Row ─────────────────────────────────────────────── */}
      <QuickStatsRow stats={stats} loading={loading} />
    </div>
  )
}