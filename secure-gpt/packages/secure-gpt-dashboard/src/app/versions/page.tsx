'use client'

import { LinkButton } from '@/components/ui'
import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'
import {
  Layers,
  Server,
  ShieldCheck,
  ArrowLeft,
  History,
} from 'lucide-react'
import { TabKey, VersionItem } from '@/config/versions.data'
import { VersionCard } from '@/components/versions/VersionCard'
import { useSystemVersion } from '@/contexts/system-version-context'

export default function DedicatedVersionsPage() {
  const { user, loading: authLoading } = useAuth()
  const { currentVersion, adminVersion, extensionVersion, releases, loading } = useSystemVersion()
  const [activeTab, setActiveTab] = useState<TabKey>('baseline')

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge: string; description: string }[] = [
    {
      key: 'baseline',
      label: 'Baseline Product',
      icon: <Layers size={16} />,
      badge: `v${currentVersion}`,
      description: 'Core backend, API gateway, telemetry, and DLP engine infrastructure.',
    },
    {
      key: 'admin',
      label: 'Admin Version History',
      icon: <Server size={16} />,
      badge: `v${adminVersion}`,
      description: 'Administrative console, RBAC, tenant management, and audit logging.',
    },
    {
      key: 'extension',
      label: 'Extension Version',
      icon: <ShieldCheck size={16} />,
      badge: `${releases.extension?.length || 0} releases (v${extensionVersion})`,
      description: 'Browser-native DLP extension, WASM scanner, and DOM interception.',
    },
  ]

  const activeVersions: VersionItem[] = releases[activeTab] || []

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--bg-base)',
        fontFamily: 'var(--font-poppins), Poppins, system-ui, sans-serif',
      }}
    >
      {/* ── Navigation ── */}
      <nav
        className="border-b sticky top-0 z-50 backdrop-blur-md"
        style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="size-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden"
              style={{ background: 'var(--brand-dark)' }}
            >
              <img src="/rivedix_logo.png" alt="SecureGPT" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Secure<span style={{ color: 'var(--accent)' }}>GPT</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={14} />
              Back to Home
            </Link>

            {!loading && user ? (
              <LinkButton variant="ghost" className="text-sm font-semibold" href="/dashboard">

                  Dashboard

              </LinkButton>
            ) : (
              <LinkButton variant="ghost" className="text-sm font-semibold" href="/login">

                  Sign In

              </LinkButton>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 py-14 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header Banner */}
          <div className="space-y-4">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
              style={{
                background: 'var(--accent-light)',
                borderColor: 'var(--accent-border)',
                color: 'var(--accent-text)',
              }}
            >
              <History size={13} />
              Production Release Ledger
            </div>

            <h1 className="text-3xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Version History & Release Notes
            </h1>

            <p className="text-base max-w-3xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Explore comprehensive release notes across all SecureGPT tiers. Every feature addition, functionality
              adjustment, architectural improvement, and bug fix is tracked below.
            </p>
          </div>

          {/* Three Main Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 rounded-md border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
            {tabs.map((t) => {
              const isActive = activeTab === t.key
              return (
                <Button variant={isActive ? 'primary' : 'ghost'}
                  key={t.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveTab(t.key)}
                  className={`h-auto min-h-28 w-full items-stretch p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isActive ? 'shadow-md text-white' : 'hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className={isActive ? 'text-white' : 'text-[var(--accent)]'}>{t.icon}</span>
                      <span className={isActive ? 'text-white' : 'text-[var(--text-primary)]'}>{t.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)]'
                      }`}
                    >
                      {t.badge}
                    </span>
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${isActive ? 'text-white/85' : 'text-[var(--text-secondary)]'}`}
                  >
                    {t.description}
                  </p>
                </Button>
              )
            })}
          </div>

          {/* Release Cards Stream */}
          <div className="space-y-8">
            {activeVersions.map((item) => (
              <VersionCard key={item.version} item={item} />
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-10 border-t mt-auto"
        style={{ background: 'var(--brand-dark)', borderColor: 'var(--brand-mid)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'var(--on-dark-low)' }}>
            © {new Date().getFullYear()} Rivedix. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium" style={{ color: 'var(--on-dark-mid)' }}>
            <Link href="/" style={{ color: 'inherit' }}>
              Home
            </Link>
            <Link href="/privacy" style={{ color: 'inherit' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: 'inherit' }}>
              Terms of Service
            </Link>
            <a href="mailto:info@rivedix.com" style={{ color: 'inherit' }}>
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
