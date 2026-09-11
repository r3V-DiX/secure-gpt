'use client'
// src/app/(app)/get-started/page.tsx
// Step-by-step onboarding tutorial for new users:
// install the extension → connect account → verify → policy → track.
// Progress is persisted locally so returning users can pick up where they left off.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity, Circle, CircleCheck, Download, ExternalLink,
  MousePointerClick, PartyPopper, SlidersHorizontal, Zap,
  Building2, Users, CheckCircle2
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/features/profile/hooks/use-profile'

const CHROME_STORE_URL =
  'https://chromewebstore.google.com/detail/securegpt-%E2%80%94-llm-data-prot/cbhlhbhhlcfilggkmcmodmfaeongmbmo'
const STORAGE_KEY = 'securegpt:get-started:done'

const SUPPORTED_PLATFORMS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity', 'Meta AI']

interface Step {
  id: string
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    id: 'install',
    icon: Download,
    title: 'Install the Chrome extension',
    description:
      'SecureGPT runs entirely inside your browser. Install it from the Chrome Web Store, then pin it to your toolbar so protection is always one click away.',
  },
  {
    id: 'connect',
    icon: MousePointerClick,
    title: 'Connect your account',
    description:
      'Click the SecureGPT icon in your toolbar and sign in with Google. It reuses the same secure session as this dashboard, so your extension and account are linked instantly.',
  },
  {
    id: 'verify',
    icon: Zap,
    title: 'Verify it works',
    description:
      `Open ${SUPPORTED_PLATFORMS.slice(0, 4).join(', ')} or another supported AI platform and type a prompt that contains sensitive data like an email, phone number, or API key. Watch it get masked or blocked in real time.`,
  },
  {
    id: 'policy',
    icon: SlidersHorizontal,
    title: 'Review your policy',
    description:
      'Policies decide what happens to sensitive data. Tune the built-in categories (PII, financial, confidential, IP) or add your own regex rules to match your team.',
  },
  {
    id: 'track',
    icon: Activity,
    title: 'Track activity & devices',
    description:
      'Every detection shows up in your Event Log. See which browsers are protected, export logs as CSV, and watch your dashboard stats grow as you work.',
  },
]

export default function GetStartedPage() {
  const { user } = useAuth()
  const { devices, loading: devicesLoading } = useProfile()
  const [done, setDone] = useState<string[]>([])

  const isOrgAdmin = user?.role === 'org_admin' || user?.role === 'super_admin' || user?.role === 'platform_super_admin'
  const isEmployee = user?.role === 'employee'

  const activeSteps: Step[] = isOrgAdmin
    ? [
        {
          id: 'verify_domain',
          icon: Building2,
          title: 'Verify Corporate Domain (DNS TXT)',
          description: 'Add the challenge TXT record to your DNS provider to activate domain-level protection and unlock employee invitations.',
        },
        {
          id: 'invite_team',
          icon: Users,
          title: 'Invite Team & Assign Departments',
          description: 'Invite employees matching your corporate domain and segregate policies by Engineering, Finance, or General Org Baseline.',
        },
        {
          id: 'policy',
          icon: SlidersHorizontal,
          title: 'Configure Enterprise DLP Policy',
          description: 'Establish organization-wide thresholds for PII, Financial data, API keys, and toggle Document & File Scanning.',
        },
        {
          id: 'install',
          icon: Download,
          title: 'Deploy Browser Extension',
          description: 'Install or push the Chrome Extension to team workstations via Google Workspace or Chrome Enterprise MDM.',
        },
        {
          id: 'track',
          icon: Activity,
          title: 'Monitor Audit Logs & Incidents',
          description: 'Review blocked prompts, audit logs, and trigger leaderboards across all company departments.',
        },
      ]
    : STEPS

  // Hydrate completion state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setDone(parsed.filter((x) => typeof x === 'string'))
      }
    } catch {
      /* storage unavailable — ignore */
    }
  }, [])

  function toggleStep(id: string) {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const completed = activeSteps.filter((s) => done.includes(s.id)).length
  const pct = Math.round((completed / activeSteps.length) * 100)
  const allDone = completed === activeSteps.length
  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap pt-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Get Started, {firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Set up SecureGPT in a few minutes — install, connect, and start protecting your AI chats.
          </p>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium"
          style={{
            background: 'var(--bg-surface)',
            borderColor: devicesLoading ? 'var(--border)' : devices.length > 0 ? 'var(--success-border)' : 'var(--warning-border)',
            color: devicesLoading ? 'var(--text-secondary)' : devices.length > 0 ? 'var(--success)' : 'var(--warning)',
          }}>
          <span className="size-1.5 rounded-full"
            style={{ background: devicesLoading ? 'var(--text-tertiary)' : devices.length > 0 ? 'var(--success)' : 'var(--warning)' }} />
          {devicesLoading
            ? 'Checking connection…'
            : devices.length > 0
              ? `${devices.length} device${devices.length === 1 ? '' : 's'} connected`
              : 'No device connected yet'}
        </div>
      </div>

      {/* ── Progress card ───────────────────────────────────────────────── */}
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--text-tertiary)' }}>
              Setup progress
            </span>
            {allDone && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
                Complete 🎉
              </span>
            )}
          </div>
          <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {completed}/{activeSteps.length} steps
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${pct}%`,
              background: allDone
                ? 'linear-gradient(90deg, var(--success) 0%, #34d399 100%)'
                : 'linear-gradient(90deg, var(--accent) 0%, #818cf8 100%)',
            }} />
        </div>
        <p className="text-xs mt-2.5" style={{ color: 'var(--text-tertiary)' }}>
          {allDone
            ? 'Everything is set up. You’re protected — happy prompting!'
            : 'Mark each step as you complete it. Your progress is saved on this browser.'}
        </p>
      </div>

      {/* ── Step cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {activeSteps.map((step, i) => {
          const isDone = done.includes(step.id)
          const Icon = step.icon
          return (
            <div
              key={step.id}
              className="card p-5 animate-fade-in"
              style={{
                animationDelay: `${i * 60}ms`,
                borderColor: isDone ? 'var(--success-border)' : undefined,
              }}
            >
              <div className="flex gap-4">
                {/* Step icon */}
                <div
                  className="size-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300"
                  style={{
                    background: isDone ? 'var(--success-light)' : 'var(--accent-light)',
                    border: `1.5px solid ${isDone ? 'var(--success-border)' : 'var(--accent-border)'}`,
                    color: isDone ? 'var(--success)' : 'var(--accent-text)',
                  }}
                >
                  <Icon size={19} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        <span className="mr-1.5 font-mono text-xs align-baseline" style={{ color: 'var(--text-tertiary)' }}>
                          {i + 1}.
                        </span>
                        {step.title}
                      </h2>
                      <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {step.description}
                      </p>
                    </div>

                    {/* Mark done toggle */}
                    <button
                      onClick={() => toggleStep(step.id)}
                      aria-pressed={isDone}
                      aria-label={isDone ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all shrink-0 cursor-pointer hover:brightness-105"
                      style={{
                        background: isDone ? 'var(--success-light)' : 'var(--bg-surface-2)',
                        borderColor: isDone ? 'var(--success-border)' : 'var(--border-2)',
                        color: isDone ? 'var(--success)' : 'var(--text-tertiary)',
                      }}
                    >
                      {isDone ? <CircleCheck size={13} /> : <Circle size={13} />}
                      {isDone ? 'Done' : 'Mark done'}
                    </button>
                  </div>

                  {/* Action */}
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    {renderAction(step.id)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Completion banner ───────────────────────────────────────────── */}
      {allDone && (
        <div className="rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-4 animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, var(--success-light) 0%, var(--bg-surface) 60%)',
            borderColor: 'var(--success-border)',
          }}>
          <div className="size-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--success-light)', border: '1.5px solid var(--success-border)', color: 'var(--success)' }}>
            <PartyPopper size={22} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              You're all set!
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Your browser is protected. Head to the dashboard to watch detections, or the event log to dig into what was caught.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/event-logs"
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}>
              View Event Log
            </Link>
            <Link href="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
              style={{ background: 'var(--success)', boxShadow: '0 2px 8px var(--success-glow)' }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Per-step actions ──────────────────────────────────────────────────────── */

function renderAction(id: string) {
  switch (id) {
    case 'install':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={CHROME_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}
          >
            <Download size={13} />
            Open Chrome Web Store
            <ExternalLink size={11} style={{ opacity: 0.7 }} />
          </a>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Tip: right-click the puzzle icon → <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Pin</span> to keep SecureGPT on your toolbar.
          </p>
        </div>
      )

    case 'connect':
      return (
        <div className="space-y-3">
          <ol className="space-y-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <li><span className="font-bold mr-1" style={{ color: 'var(--text-tertiary)' }}>1.</span>Click the SecureGPT icon in your browser toolbar.</li>
            <li><span className="font-bold mr-1" style={{ color: 'var(--text-tertiary)' }}>2.</span>Click <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sign in with Google</span> — use the same account as this dashboard.</li>
            <li><span className="font-bold mr-1" style={{ color: 'var(--text-tertiary)' }}>3.</span>The popup shows <span className="font-semibold" style={{ color: 'var(--success)' }}>Active</span> and your account name once connected.</li>
          </ol>
          <Link href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}>
            Check registered devices
          </Link>
        </div>
      )

    case 'verify':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/event-logs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
            style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}>
            <Activity size={13} />
            Open Event Log
          </Link>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Try sending <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>“my email is john.doe@acme.com”</span> to a supported AI platform.
          </p>
        </div>
      )

    case 'policy':
      return (
        <Link href="/policy"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-glow)' }}>
          <SlidersHorizontal size={13} />
          Review your policy
        </Link>
      )

    case 'track':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/event-logs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}>
            <Activity size={13} />
            View Event Log
          </Link>
          <Link href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-105"
            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border-2)', color: 'var(--text-primary)' }}>
            <SlidersHorizontal size={13} />
            Settings & devices
          </Link>
        </div>
      )

    default:
      return null
  }
}
