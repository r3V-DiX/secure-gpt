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

type TabKey = 'baseline' | 'admin' | 'extension'

interface VersionItem {
  version: string
  date: string
  status: string
  tag: string
  commit: string
  summary: string
  info: string
  whatsNew: string[]
  changedFunctionality: string[]
  improvements: string[]
  problemsSolved: string[]
}

const BASELINE_VERSIONS: VersionItem[] = [
  {
    version: '1.0.0',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Baseline Production Release',
    commit: 'prod-v1.0.0',
    summary: 'Initial production baseline establishing enterprise DLP interception, multi-tenant policy synchronization, audit telemetry, and centralized release tracking.',
    info: 'SecureGPT Core Platform encompasses the core backend API, client policy engine, multi-platform DLP runtime, and end-to-end data security infrastructure.',
    whatsNew: [
      'Production Release Tracker protocol with single source of truth manifest in RELEASE_TRACKER.md.',
      'Public unauthenticated health and version introspection endpoint (/api/v1/system/version).',
      'Unified enterprise telemetry pipeline logging violations, masked prompts, and blocked egress events.',
      'Multi-tenant policy engine supporting Organization Master Policies and Department Overrides.',
      'Cryptographic client fingerprinting (platform, timezone, display metrics) to prevent session hijacking.',
    ],
    changedFunctionality: [
      'Standardized API route prefix to /api/v1 with centralized envelope responses across all endpoints.',
      'Replaced hardcoded policy parameters with dynamic JSON schema-backed rule configurations.',
      'Switched session management to strict SameSite cookie handling with automated refresh hooks.',
    ],
    improvements: [
      'Sub-millisecond token evaluation using precompiled regex scanners and optimized AST matching.',
      'Database connection pooling with SQLAlchemy async sessions and automatic connection recycling.',
      'Automated deployment stabilization checks in secure-gpt-update.sh.',
    ],
    problemsSolved: [
      'Resolved cross-origin cookie sync dropping between dashboard frontend and backend API.',
      'Eliminated unversioned production deployments with rigorous SemVer check-in gating.',
      'Prevented accidental token leakage through strict backend error sanitization and response filtering.',
    ],
  },
]

const ADMIN_VERSIONS: VersionItem[] = [
  {
    version: '1.0.0',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Admin Control Plane v1',
    commit: 'admin-v1.0.0',
    summary: 'Dedicated administrative control plane for Super Admins and Security Officers to manage enterprise policies, roles, and audit compliance.',
    info: 'SecureGPT Admin Console is the security management suite providing granular RBAC, department-level DLP controls, tenant management, and system logs.',
    whatsNew: [
      'Admin System Version inspection endpoint (/api/v1/system/version) reporting control plane builds.',
      'Role-Based Access Control (RBAC) supporting Super Admin, Security Admin, Org Admin, and Viewer permissions.',
      'Global Audit Log viewer with tamper-evident event streaming and actor tracking.',
      'Departmental policy customization allowing customized sensitivity per team (e.g. Finance vs Engineering).',
    ],
    changedFunctionality: [
      'Decoupled Admin API routing from general user endpoints for stronger security isolation.',
      'Upgraded table pagination and filtering to server-side query parameters for large audit volumes.',
    ],
    improvements: [
      'Optimized administrative dashboard metric queries with Redis-backed caching and aggregation.',
      'Polished theme system supporting seamless dark/light switching with WCAG AAA contrast compliance.',
      'Compact sidebar collapse state persistent in browser storage.',
    ],
    problemsSolved: [
      'Fixed circular JSON reference crash during policy save mutations caused by synthetic React DOM event propagation.',
      'Prevented privilege escalation by strictly verifying scope claims on every administrative mutation.',
      'Fixed secondary admin redirect loop during OAuth callback verification.',
    ],
  },
]

const EXTENSION_VERSIONS: VersionItem[] = [
  {
    version: '1.2.0',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Manifest V3 Production Build',
    commit: 'ext-v1.2.0',
    summary: 'High-performance browser extension providing zero-latency DOM interception and client-side DLP scanning across major AI platforms.',
    info: 'SecureGPT Chrome Extension operates entirely inside the user browser, scanning and redacting sensitive data locally before it ever reaches LLM servers.',
    whatsNew: [
      'Expanded LLM coverage across 15+ major platforms including ChatGPT, Claude, Gemini, Copilot, Perplexity, Cursor, Poe, and DeepSeek.',
      'Document & attachment scanning engine powered by WebAssembly (@firecrawl/anydoc-wasm) and PDF.js.',
      'Configurable DLP Action states: ALLOW, MASK (real-time redaction), WARN, and BLOCK modal.',
      'Extension shadow DOM overlay with isolated stylesheet to eliminate host site CSS bleed.',
    ],
    changedFunctionality: [
      'Optimized input listener pipeline to eliminate typing lag prior to form submission.',
      'Switched policy cache to chrome.storage.local with periodic background sync alarms.',
    ],
    improvements: [
      'Reduced memory footprint to under 28MB even while processing multi-page PDF documents in-browser.',
      'Faster regex evaluation using segmented rule tiers (Secrets -> PII -> Custom Org Patterns).',
      'Smoother shadow DOM animations with zero main-thread layout thrashing.',
    ],
    problemsSolved: [
      'Fixed keystroke interception interfering with Claude.ai and Perplexity autocomplete dropdowns.',
      'Solved modal z-index conflicts where host application popups covered the DLP warning shield.',
      'Fixed offline fallback policy failure when browser is disconnected from enterprise server.',
    ],
  },
]

export function VersionHistorySection() {
  const [activeTab, setActiveTab] = useState<TabKey>('baseline')

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count: number; badge: string }[] = [
    {
      key: 'baseline',
      label: 'Baseline Product',
      icon: <Layers size={16} />,
      count: BASELINE_VERSIONS.length,
      badge: 'v1.0.0',
    },
    {
      key: 'admin',
      label: 'Admin Console',
      icon: <Server size={16} />,
      count: ADMIN_VERSIONS.length,
      badge: 'v1.0.0',
    },
    {
      key: 'extension',
      label: 'Chrome Extension',
      icon: <ShieldCheck size={16} />,
      count: EXTENSION_VERSIONS.length,
      badge: 'v1.2.0',
    },
  ]

  const activeVersions: VersionItem[] =
    activeTab === 'baseline'
      ? BASELINE_VERSIONS
      : activeTab === 'admin'
      ? ADMIN_VERSIONS
      : EXTENSION_VERSIONS

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
            className="p-1.5 rounded-2xl border flex items-center gap-1.5 flex-wrap justify-center"
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
              className="rounded-3xl border overflow-hidden transition-all duration-300"
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
                  className="p-6 rounded-2xl border flex flex-col justify-between"
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
                  className="p-6 rounded-2xl border flex flex-col justify-between"
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
                  className="p-6 rounded-2xl border flex flex-col justify-between"
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
                  className="p-6 rounded-2xl border flex flex-col justify-between"
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
