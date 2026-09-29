'use client'

import { Badge } from '@/components/ui'
import { Button } from '@/components/ui'
import React, { useState } from 'react'
import {
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react'
import { TabKey, VersionItem } from '@/config/versions.data'
import { useSystemVersion } from '@/contexts/system-version-context'
import { VersionCard } from './VersionCard'

export function VersionHistorySection() {
  const { currentVersion, adminVersion, extensionVersion, releases, loading } = useSystemVersion()
  const [activeTab, setActiveTab] = useState<TabKey>('baseline')

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number; badge: string }[] = [
    {
      key: 'baseline',
      label: 'Baseline Product',
      icon: <Layers size={16} />,
      count: releases.baseline?.length || 0,
      badge: `v${currentVersion}`,
    },
    {
      key: 'admin',
      label: 'Admin Console',
      icon: <Server size={16} />,
      count: releases.admin?.length || 0,
      badge: `v${adminVersion}`,
    },
    {
      key: 'extension',
      label: 'Chrome Extension',
      icon: <ShieldCheck size={16} />,
      count: releases.extension?.length || 0,
      badge: `v${extensionVersion}`,
    },
  ]

  const activeVersions: VersionItem[] = releases[activeTab] || []

  return (
    <section id="versions" className="py-24 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border"
            style={{
              background: 'var(--accent-light)',
              borderColor: 'var(--accent-border)',
              color: 'var(--accent-text)',
            }}
          >
            <Sparkles size={14} />
            <span>Platform Evolution</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            System Releases &amp; Version History
          </h2>
          <p className="text-base md:text-lg font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Track continuous engineering milestones across our enterprise core platform, administrative governance console, and browser extension.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <Button variant="primary" type="button"
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'shadow-md scale-[1.02]'
                    : 'hover:border-slate-400 dark:hover:border-slate-600'
                }`}
                style={{ background: isActive ? 'var(--accent)' : 'var(--bg-surface-2)', borderColor: isActive ? 'var(--accent)' : 'var(--border)', color: isActive ? '#ffffff' : 'var(--text-secondary)' }}
              >
                <span className={isActive ? 'text-white' : 'text-[var(--accent)]'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                <Badge variant="neutral"
                  className="font-mono"
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--bg-surface-3)',
                    color: isActive ? '#ffffff' : 'var(--text-tertiary)',
                  }}
                >
                  {tab.badge}
                </Badge>
              </Button>
            )
          })}
        </div>

        {/* Timeline Version Cards */}
        <div className="space-y-8">
          {loading && (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Loading system releases...
            </div>
          )}

          {!loading && activeVersions.length === 0 && (
            <div className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No release notes available for this component.
            </div>
          )}

          {activeVersions.map((item, index) => (
            <VersionCard key={`${activeTab}-${item.version}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
