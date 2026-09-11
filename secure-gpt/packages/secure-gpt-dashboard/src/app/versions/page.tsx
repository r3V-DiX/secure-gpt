'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'
import {
  Layers,
  Server,
  ShieldCheck,
  Zap,
  Clock,
  GitCommit,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Wrench,
  ArrowLeft,
  Shield,
  History,
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
    version: '1.1.2',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Radial UX Polish & Streamlined DLP',
    commit: 'prod-v1.1.2',
    summary: 'Streamlined real-time DLP prompt experience removing disruptive floating warning modals in favor of a sleek, non-intrusive radial risk indicator and updated component orchestration.',
    info: 'SecureGPT Core Platform v1.1.2 delivers refined real-time risk indication with zero UI clutter, alongside synchronous submission blocking.',
    whatsNew: [
      'Minimalist inline radial risk gauge cleanly indicating real-time prompt risk levels without distracting popover tooltips.',
      'Refactored input listeners to decouple asynchronous background risk assessment from instant user typing.',
      'Updated system component versions and telemetry matrices across all user and admin nodes.',
    ],
    changedFunctionality: [
      'Permanently removed live popover warning cards from prompt textareas.',
      'Enforced prompt blocking strictly at form submission (Enter / Send button) while keeping continuous live visual risk feedback.',
    ],
    improvements: [
      'Zero layout disruption and completely unobscured prompt input fields.',
      'Reduced memory footprint and eliminated extraneous DOM event listener allocations.',
    ],
    problemsSolved: [
      'Eliminated disruptive tooltip overlays covering prompt text and autocomplete menus.',
      'Prevented accidental prompt submission interruption during active editing.',
    ],
  },
  {
    version: '1.1.0',
    date: 'September 11, 2026',
    status: 'Released',
    tag: 'Phase 1 Core & Org Controls Release',
    commit: 'prod-v1.1.0',
    summary: 'Comprehensive Phase 1 milestone release delivering non-blocking prompt evaluation with radial risk gauge, document scanning policy toggles, 15+ LLM platform coverage, Microsoft Entra ID OAuth, live team role management, and DNS domain verification gating.',
    info: 'SecureGPT Core Platform v1.1.0 unifies enterprise identity, third-party risk management (TPRM) onboarding, and non-intrusive prompt protection.',
    whatsNew: [
      'Asynchronous prompt evaluation with dynamic radial percentage risk gauge anchored to LLM input fields without typing lag.',
      'Document & File Scanning Policy toggle allowing admins to inspect or bypass PDF, Office documents, and image uploads.',
      'Expanded LLM platform coverage across 15+ AI tools (ChatGPT, Claude, Gemini, Copilot, Perplexity, Meta AI, Poe, Mistral, Cursor, v0, Replit, HuggingChat, DeepSeek, Phind, Notion AI, Jasper, Copy.ai).',
      'Microsoft Entra ID (Azure AD / Office 365) OAuth authentication alongside Google Workspace.',
      'Live Team Role Management allowing Org Admins to switch roles (EMPLOYEE, ORG_ADMIN, USER) directly from team table.',
      'Domain verification gating preventing employee invitations until corporate domain ownership is confirmed via DNS TXT record challenge.',
      'Sticky Department Back-Navigation on policy page for seamless return to team view.',
      'Clear Account Type & Role Badges (Super Admin, Org Admin, Employee, Personal User) in user and admin dashboards.',
    ],
    changedFunctionality: [
      'Removed live blocking keystroke listeners before Enter key press to eliminate editor lag and DOM collisions.',
      'Updated Get Started onboarding checklist to dynamically tailor steps for Org Admins vs Employees vs Personal Users.',
      'Elevated admin role checking during OAuth callback to cleanly handle all administrative roles without false redirects.',
    ],
    improvements: [
      'Smooth CSS SVG circle transition for real-time risk scores from 0% (Clean) to 100% (Critical Risk).',
      'Debounced input analysis at 600ms providing near-instant visual feedback with zero main-thread blockage.',
      'Automated account reactivation for existing users during OAuth login within 45-day grace period.',
    ],
    problemsSolved: [
      'Completely eliminated typing latency and cursor displacement in contenteditable chat inputs.',
      'Fixed circular JSON reference serialization error on policy save bar in user and admin portals.',
      'Fixed existing user login rejection during Google and Microsoft OAuth flows.',
      'Prevented unverified domain admins from inviting colleagues before verifying domain control.',
    ],
  },
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
    version: '1.1.2',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Control Plane Version Parity & Telemetry Sync',
    commit: 'admin-v1.1.2',
    summary: 'Synchronized administrative control plane aligning system metadata, telemetry endpoints, and component introspection with v1.1.2 core platform.',
    info: 'SecureGPT Admin Console v1.1.2 ensures uniform version telemetry and monitoring alignment across enterprise deployments.',
    whatsNew: [
      'Synchronized component metadata endpoints with Extension v1.2.1 and Dashboard v1.1.2.',
      'Refined policy state verification against updated extension interception models.',
    ],
    changedFunctionality: [
      'Updated live health and component version endpoints to broadcast unified v1.1.2 ecosystem metrics.',
    ],
    improvements: [
      'Instant component matrix synchronization across all administrative inspection views.',
    ],
    problemsSolved: [
      'Eliminated version drift reporting between user and administrative backend instances.',
    ],
  },
  {
    version: '1.1.0',
    date: 'September 11, 2026',
    status: 'Released',
    tag: 'Admin RBAC & Policy Scope Expansion',
    commit: 'admin-v1.1.0',
    summary: 'Admin Control Plane v1.1.0 delivers policy trigger leaderboards for top employees and departments, dynamic role modification directly in team views, and document scanning toggles.',
    info: 'SecureGPT Admin Console centralizes organizational governance, telemetry, and departmental policy overrides.',
    whatsNew: [
      'Top Employees & Departments Policy Trigger Leaderboard on Admin Dashboard.',
      'Document & File Scanning master policy toggle for administrative governance.',
      'Team Role management endpoint allowing instant role elevation and demotion.',
      'Sticky Department Back-Navigation for departmental policy editing.',
      'Clean multi-role checking in administrative OAuth callback routing.',
    ],
    changedFunctionality: [
      'Enforced domain verification gate on team invitations to prevent unauthorized employee onboarding.',
      'Enhanced SaveBar handlers to eliminate synthetic React event leakage into JSON payloads.',
    ],
    improvements: [
      'Visual role status badges for Super Admin, Security Admin, and Org Admin.',
      'Real-time DNS TXT record challenge instructions with instant copy actions.',
    ],
    problemsSolved: [
      'Resolved circular JSON error on policy save.',
      'Eliminated admin login loop bouncing secondary admins to user portal.',
    ],
  },
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
    version: '1.2.1',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Streamlined Radial Risk Gauge',
    commit: 'ext-v1.2.1',
    summary: 'Streamlined real-time DLP experience removing intrusive popover cards and tooltips, exclusively featuring the lightweight Shadow DOM radial risk gauge.',
    info: 'SecureGPT Extension v1.2.1 provides clean, non-intrusive prompt risk visualization with zero prompt occlusion and synchronous form-submission DLP protection.',
    whatsNew: [
      'Exclusive Shadow DOM radial risk percentage gauge with zero-friction visual threat cues.',
      'Completely removed floating live warning tooltip overlays and redundant popover action bars.',
      'Lightweight memory optimization with eliminated temporary tooltip DOM trees.',
    ],
    changedFunctionality: [
      'Removed live-warning-tooltip component from extension content scripts.',
      'DLP actions (mask/block) enforce cleanly on submission while the radial gauge provides passive continuous risk scoring.',
    ],
    improvements: [
      'Unobstructed typing area across all 15+ monitored generative AI platforms.',
      'Even faster DOM evaluation cycle with zero layout disruption.',
    ],
    problemsSolved: [
      'Fixed floating tooltip cards covering chat input boxes and platform-native dropdown menus.',
      'Eliminated click interception issues caused by transient popover elements.',
    ],
  },
  {
    version: '1.2.0',
    date: 'September 11, 2026',
    status: 'Released',
    tag: 'Manifest V3 Production Build',
    commit: 'ext-v1.2.0',
    summary: 'High-performance browser extension providing zero-latency DOM interception, WebAssembly document parsing, and client-side DLP scanning across 15+ AI platforms.',
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
  {
    version: '1.1.3',
    date: 'August 11, 2026',
    status: 'Released',
    tag: 'Office & Document DLP Engine',
    commit: 'ext-v1.1.3',
    summary: 'Complete client-side document inspection pipeline for Office documents, spreadsheets, slides, and tabular data.',
    info: 'Introduced local document dissection and redaction before upload to ChatGPT and Claude file handlers.',
    whatsNew: [
      'Added document parsing and redaction/masking for Office documents (.docx, .xlsx, .pptx, .odt, .csv).',
      'Client-side file drop-zone interceptor catching files dragged into web LLM chat windows.',
      'Visual file inspection progress dialog showing scanning progress and detected risk count.',
    ],
    changedFunctionality: [
      'Intercepts browser File/Blob drag-and-drop and input[type="file"] change events prior to upload payload generation.',
      'Allows selective entity redaction inside structured documents without corrupting file headers or archives.',
    ],
    improvements: [
      'Asynchronous ZIP archive decompression in Web Workers preventing UI freezing during large file parsing.',
      'Optimized memory buffer deallocation after document scanning completes.',
    ],
    problemsSolved: [
      'Resolved false-negative leaks where users attached sensitive spreadsheets and confidential presentations to LLM prompts.',
      'Fixed file corruption on re-serialized .docx files after replacing PII tokens.',
      'Prevented browser tab lockups on large CSV datasets over 10MB.',
    ],
  },
  {
    version: '1.1.2',
    date: 'July 26, 2026',
    status: 'Released',
    tag: 'OCR & Vision Upgrade',
    commit: 'ext-v1.1.2',
    summary: 'Tier 3 client-side OCR Canvas Preprocessing and quantitative accuracy testing harness.',
    info: 'Upgraded detection subsystem with high-DPI rescaling, luminance grayscaling, and adaptive binarization for image screenshots.',
    whatsNew: [
      'Tier 3 client-side OCR image preprocessing with canvas-based 2x high-DPI scaling and adaptive thresholding.',
      'Automatic rotation orientation detection (90°, 180°, 270°) for mobile and portrait screenshots.',
      'Dual-pass OCR pipeline: First pass PSM.AUTO, secondary pass PSM.SPARSE_TEXT when PII is suspected.',
    ],
    changedFunctionality: [
      'Images dragged into chat are processed through client canvas before invoking Tesseract OCR runtime.',
      'Detection confidence threshold calibration aligned with gold-standard evaluation harness.',
    ],
    improvements: [
      '94.2% recall rate on low-contrast screenshots, dark-mode terminal captures, and code snippets.',
      'Reduced OCR preprocessing latency by 35% through direct typed-array byte manipulation.',
    ],
    problemsSolved: [
      'Fixed OCR failures on low-contrast dark mode screenshots where white-on-dark text was dropped.',
      'Prevented memory exhaustion caused by uncollected canvas contexts during rapid sequential screenshot uploads.',
    ],
  },
  {
    version: '1.1.1',
    date: 'July 8, 2026',
    status: 'Released',
    tag: 'Initial Public Extension',
    commit: 'ext-v1.1.1',
    summary: 'Initial public release of SecureGPT browser extension built on Chrome Manifest V3.',
    info: 'First official Chrome Web Store release providing real-time client-side prompt interception for ChatGPT, Claude, and Gemini.',
    whatsNew: [
      'Manifest V3 compliant background service worker with alarms-based policy synchronization.',
      'Real-time prompt text interception on Enter key and Submit button click.',
      'Core PII detection library: Names, Email addresses, Phone numbers, Physical addresses, and Social Security Numbers.',
      'Secrets detection: AWS keys, OpenAI keys, GitHub tokens, database connection URIs, and JWTs.',
      'Extension popup menu displaying active policy sync status and local violation count.',
    ],
    changedFunctionality: [
      'Replaced deprecated Manifest V2 background page architecture with modern declarative event-driven service workers.',
      'Offscreen document lifecycle management for CPU-intensive NER and regex tasks.',
    ],
    improvements: [
      'Sub-5ms prompt scanning overhead with zero detectable input lag during normal typing.',
      'Zero external server dependency for text inspection — complete local execution.',
    ],
    problemsSolved: [
      'Prevented accidental corporate data leaks during employee interactions with generative AI tools.',
      'Fixed Service Worker termination mid-inspection by wrapping async DLP pipelines in keep-alive ports.',
    ],
  },
]

export default function DedicatedVersionsPage() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('baseline')

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge: string; description: string }[] = [
    {
      key: 'baseline',
      label: 'Baseline Product',
      icon: <Layers size={16} />,
      badge: 'v1.1.2',
      description: 'Core backend, API gateway, telemetry, and DLP engine infrastructure.',
    },
    {
      key: 'admin',
      label: 'Admin Version History',
      icon: <Server size={16} />,
      badge: 'v1.1.2',
      description: 'Administrative console, RBAC, tenant management, and audit logging.',
    },
    {
      key: 'extension',
      label: 'Extension Version',
      icon: <ShieldCheck size={16} />,
      badge: '5 releases (v1.2.1)',
      description: 'Browser-native DLP extension, WASM scanner, and DOM interception.',
    },
  ]

  const activeVersions: VersionItem[] =
    activeTab === 'baseline'
      ? BASELINE_VERSIONS
      : activeTab === 'admin'
      ? ADMIN_VERSIONS
      : EXTENSION_VERSIONS

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
              <Link href="/dashboard">
                <Button variant="ghost" className="text-sm font-semibold">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-semibold">
                  Sign In
                </Button>
              </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 rounded-2xl border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
            {tabs.map((t) => {
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`p-4 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isActive ? 'shadow-md text-white' : 'hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                  }`}
                  style={{
                    background: isActive ? 'var(--accent)' : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className={isActive ? 'text-white' : 'text-[var(--accent)]'}>{t.icon}</span>
                      <span style={{ color: isActive ? '#ffffff' : 'var(--text-primary)' }}>{t.label}</span>
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
                    className="text-xs leading-relaxed"
                    style={{ color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}
                  >
                    {t.description}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Release Cards Stream */}
          <div className="space-y-8">
            {activeVersions.map((item) => (
              <article
                key={item.version}
                className="rounded-3xl border overflow-hidden transition-all duration-300 shadow-sm"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                {/* Release Card Header */}
                <div
                  className="p-6 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{
                    background: 'var(--bg-surface-2)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="text-3xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>
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

                  <div
                    className="flex flex-row md:flex-col items-start md:items-end justify-between gap-2 text-xs font-mono shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                  >
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
                <div
                  className="px-6 md:px-8 py-4 border-b flex items-start gap-3 text-xs md:text-sm"
                  style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="size-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}
                  >
                    <Sparkles size={14} />
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      Version Info:{' '}
                    </span>
                    {item.info}
                  </div>
                </div>

                {/* 4 Pillars Breakdown Grid */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. What was Added New */}
                  <div
                    className="p-6 rounded-2xl border"
                    style={{
                      background: 'var(--bg-base)',
                      borderColor: 'var(--border)',
                    }}
                  >
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

                  {/* 2. What Functionality Changed */}
                  <div
                    className="p-6 rounded-2xl border"
                    style={{
                      background: 'var(--bg-base)',
                      borderColor: 'var(--border)',
                    }}
                  >
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

                  {/* 3. What was Improved */}
                  <div
                    className="p-6 rounded-2xl border"
                    style={{
                      background: 'var(--bg-base)',
                      borderColor: 'var(--border)',
                    }}
                  >
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

                  {/* 4. What Problem Solved */}
                  <div
                    className="p-6 rounded-2xl border"
                    style={{
                      background: 'var(--bg-base)',
                      borderColor: 'var(--border)',
                    }}
                  >
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
              </article>
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
