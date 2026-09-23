'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Server,
  Layers,
  Sparkles,
  RefreshCw,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  GitCommit,
  ArrowUpRight,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { TabKey, VersionItem } from '@/config/versions.data'
import { useSystemVersion } from '@/contexts/system-version-context'

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
            <Zap size={13} />
            Production Release History & Changelog
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Transparent Version History
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Every update, architectural enhancement, and bug resolution across the entire SecureGPT stack — tracked and verified in production.
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex justify-center mb-10">
          <div
            className="p-1.5 rounded-md border flex items-center gap-1.5 flex-wrap justify-center"
            style={{
              background: 'var(--bg-base)',
              borderColor: 'var(--border)',
            }}
          >
            {tabs.map((t) => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'shadow-sm text-white'
                      : 'hover:text-[var(--text-primary)] text-[var(--text-secondary)]'
                  }`}
                  style={{
                    background: isActive ? 'var(--accent)' : 'transparent',
                  }}
                >
                  <span className={isActive ? 'text-white' : 'text-[var(--accent)]'}>{t.icon}</span>
                  <span>{t.label}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-[var(--bg-surface-2)] text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    {t.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Versions Content Stream */}
        <div className="space-y-10">
          {activeVersions.map((item) => (
            <div
              key={item.version}
              className="rounded-lg border overflow-hidden transition-all duration-300"
              style={{
                background: 'var(--bg-base)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* Top Version Hero Bar */}
              <div
                className="p-6 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{
                  background: 'var(--bg-surface-2)',
                  borderColor: 'var(--border)',
                }}
              >
                <div>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      v{item.version}
                    </span>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                      style={{
                        background: 'var(--accent-light)',
                        borderColor: 'var(--accent-border)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {item.tag}
                    </span>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-md border font-mono"
                      style={{
                        background: 'var(--bg-base)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-sm md:text-base font-medium leading-relaxed max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
                    {item.summary}
                  </p>
                </div>

                <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-2 text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} style={{ color: 'var(--accent)' }} />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GitCommit size={13} style={{ color: 'var(--accent)' }} />
                    <span>Commit: {item.commit}</span>
                  </div>
                </div>
              </div>

              {/* Version Info Overview Banner */}
              <div className="px-6 md:px-8 py-4 border-b flex items-start gap-3 text-xs md:text-sm" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <div className="size-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                  <Sparkles size={14} />
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Version Info: </span>
                  {item.info}
                </div>
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. What Added New */}
                <div
                  className="p-6 rounded-md border flex flex-col justify-between"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="size-8 rounded-xl flex items-center justify-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                        <Sparkles size={16} />
                      </div>
                      <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        What was added new
                      </h4>
                    </div>

                    <ul className="space-y-2.5">
                      {item.whatsNew.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-1" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 2. What Functionality Changed */}
                <div
                  className="p-6 rounded-md border flex flex-col justify-between"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="size-8 rounded-xl flex items-center justify-center text-blue-400 bg-blue-500/10 border border-blue-500/20">
                        <RefreshCw size={16} />
                      </div>
                      <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        What functionality changed
                      </h4>
                    </div>

                    <ul className="space-y-2.5">
                      {item.changedFunctionality.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <span className="size-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 3. What was Improved */}
                <div
                  className="p-6 rounded-md border flex flex-col justify-between"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="size-8 rounded-xl flex items-center justify-center text-purple-400 bg-purple-500/10 border border-purple-500/20">
                        <Zap size={16} />
                      </div>
                      <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        What was improved
                      </h4>
                    </div>

                    <ul className="space-y-2.5">
                      {item.improvements.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <span className="size-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. What Problem Solved */}
                <div
                  className="p-6 rounded-md border flex flex-col justify-between"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="size-8 rounded-xl flex items-center justify-center text-amber-400 bg-amber-500/10 border border-amber-500/20">
                        <Wrench size={16} />
                      </div>
                      <h4 className="text-sm md:text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                        What problem was solved
                      </h4>
                    </div>

                    <ul className="space-y-2.5">
                      {item.problemsSolved.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
