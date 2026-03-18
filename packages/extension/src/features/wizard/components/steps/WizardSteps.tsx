// ─────────────────────────────────────────────
// Wizard Steps 1–7
// ─────────────────────────────────────────────

import React, { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import { Toggle } from '@/components/ui/toggle/toggle'
import { Badge } from '@/components/ui/badge/badge'
import {
  PII_CATEGORIES, PII_CATEGORY_LABELS, PII_CATEGORY_DESCRIPTIONS,
  PII_CATEGORY_EXAMPLES, POLICY_ACTIONS, POLICY_ACTION_LABELS,
  POLICY_ACTION_DESCRIPTIONS, ALL_PLATFORMS, PLATFORM_LABELS,
  PLATFORM_DOMAINS, DEFAULT_CATEGORY_ACTIONS,
} from '@securegpt/shared/constants'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'
import type { LLMPlatform } from '@securegpt/shared/constants'
import { clsx } from 'clsx'

// ── Shared step wrapper ───────────────────────
function StepWrapper({ children }: { children: React.ReactNode }) {
  return <div className="p-8 animate-slide-up">{children}</div>
}

function StepHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-8">
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">{subtitle}</p>
    </div>
  )
}

function StepFooter({ onBack, onNext, nextLabel = 'Continue', nextDisabled, loading }: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100">
      {onBack ? (
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
      ) : <div />}
      <Button variant="primary" size="md" onClick={onNext} disabled={nextDisabled} loading={loading}>
        {nextLabel} →
      </Button>
    </div>
  )
}

// ── Step 1: Welcome ───────────────────────────
export function Step1Welcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <StepWrapper>
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-white text-2xl font-bold">S</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SecureGPT</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
          Your organisation's privacy shield for AI tools. Detects and blocks sensitive data
          before it reaches ChatGPT, Gemini, Claude, and more.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          {[
            { icon: '🔍', title: 'Detect', desc: 'PII, credentials & confidential data' },
            { icon: '🛡️', title: 'Protect', desc: 'Block or mask before sending' },
            { icon: '📊', title: 'Audit', desc: 'Full compliance visibility' },
          ].map((f) => (
            <div key={f.title} className="p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="font-semibold text-sm text-blue-800">{f.title}</p>
              <p className="text-xs text-blue-600 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" size="lg" onClick={onNext}>Get Started</Button>
          <Button variant="ghost" size="lg" onClick={onSkip}>Use defaults</Button>
        </div>
      </div>
    </StepWrapper>
  )
}

// ── Step 2: Org Setup ─────────────────────────
export function Step2OrgSetup({ onNext, onBack, orgName, setOrgName }: {
  onNext: () => void; onBack: () => void
  orgName: string; setOrgName: (v: string) => void
}) {
  return (
    <StepWrapper>
      <StepHeader icon="🏢" title="Organisation Setup" subtitle="Tell us about your organisation to personalise SecureGPT." />
      <div className="space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Organisation name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Acme Corporation"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your department (optional)</label>
          <input
            type="text"
            placeholder="e.g. Engineering, Finance, Legal"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} nextDisabled={!orgName.trim()} />
    </StepWrapper>
  )
}

// ── Step 3: Categories ────────────────────────
export function Step3Categories({ onNext, onBack, config, setConfig }: {
  onNext: () => void; onBack: () => void
  config: PIIConfig; setConfig: (c: PIIConfig) => void
}) {
  function toggle(cat: PIICategory, enabled: boolean) {
    setConfig({
      ...config,
      categories: {
        ...config.categories,
        [cat]: { ...config.categories[cat], enabled },
      },
    })
  }

  return (
    <StepWrapper>
      <StepHeader icon="🔍" title="Select Data Categories" subtitle="Choose which types of sensitive data to protect." />
      <div className="space-y-3">
        {(Object.keys(PII_CATEGORIES) as PIICategory[]).map((cat) => {
          const enabled = config.categories[cat]?.enabled ?? true
          return (
            <div key={cat} className={clsx('flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer', enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50')}
              onClick={() => toggle(cat, !enabled)}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{PII_CATEGORY_LABELS[cat]}</span>
                  {enabled && <Badge variant="success" dot>Enabled</Badge>}
                </div>
                <p className="text-xs text-gray-500">{PII_CATEGORY_DESCRIPTIONS[cat]}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {PII_CATEGORY_EXAMPLES[cat].map((ex) => (
                    <span key={ex} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{ex}</span>
                  ))}
                </div>
              </div>
              <Toggle checked={enabled} onChange={(v) => toggle(cat, v)} />
            </div>
          )
        })}
      </div>
      <StepFooter onBack={onBack} onNext={onNext} />
    </StepWrapper>
  )
}

// ── Step 4: Actions ───────────────────────────
export function Step4Actions({ onNext, onBack, config, setConfig }: {
  onNext: () => void; onBack: () => void
  config: PIIConfig; setConfig: (c: PIIConfig) => void
}) {
  function setAction(cat: PIICategory, action: PolicyAction) {
    setConfig({
      ...config,
      categories: {
        ...config.categories,
        [cat]: { ...config.categories[cat], action },
      },
    })
  }

  const actionColors: Record<PolicyAction, string> = {
    BLOCK: 'border-red-300 bg-red-50 text-red-700',
    MASK: 'border-amber-300 bg-amber-50 text-amber-700',
    WARN_ALLOW: 'border-orange-300 bg-orange-50 text-orange-700',
    ALLOW: 'border-blue-300 bg-blue-50 text-blue-700',
  }

  return (
    <StepWrapper>
      <StepHeader icon="⚡" title="Configure Actions" subtitle="Set what happens when each type of data is detected." />
      <div className="space-y-4">
        {(Object.keys(PII_CATEGORIES) as PIICategory[]).map((cat) => {
          const enabled = config.categories[cat]?.enabled ?? true
          const current = (config.categories[cat]?.action ?? DEFAULT_CATEGORY_ACTIONS[cat]) as PolicyAction
          if (!enabled) return null
          return (
            <div key={cat} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
              <p className="text-sm font-semibold text-gray-800 mb-2">{PII_CATEGORY_LABELS[cat]}</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(POLICY_ACTIONS) as PolicyAction[]).map((action) => (
                  <button key={action}
                    onClick={() => setAction(cat, action)}
                    className={clsx('flex items-center gap-2 p-2.5 rounded-lg border-2 text-left text-xs font-medium transition-all', actionColors[action], current === action ? 'ring-2 ring-offset-1 ring-current opacity-100' : 'opacity-60 hover:opacity-80')}>
                    {current === action && <span>✓</span>}
                    {POLICY_ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <StepFooter onBack={onBack} onNext={onNext} />
    </StepWrapper>
  )
}

// ── Step 5: Platforms ─────────────────────────
export function Step5Platforms({ onNext, onBack, config, setConfig }: {
  onNext: () => void; onBack: () => void
  config: PIIConfig; setConfig: (c: PIIConfig) => void
}) {
  const monitoredSet = new Set(config.monitoredPlatforms)

  function toggle(platform: LLMPlatform, enabled: boolean) {
    const updated = enabled
      ? [...config.monitoredPlatforms, platform]
      : config.monitoredPlatforms.filter((p) => p !== platform)
    setConfig({ ...config, monitoredPlatforms: updated })
  }

  return (
    <StepWrapper>
      <StepHeader icon="🌐" title="Select Platforms" subtitle="Choose which AI tools to monitor." />
      <div className="grid grid-cols-2 gap-2">
        {ALL_PLATFORMS.map((platform) => {
          const isOn = monitoredSet.has(platform)
          return (
            <button key={platform}
              onClick={() => toggle(platform, !isOn)}
              className={clsx('flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left', isOn ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50')}>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{PLATFORM_LABELS[platform]}</p>
                <p className="text-xs text-gray-400">{PLATFORM_DOMAINS[platform]}</p>
              </div>
              {isOn && <span className="text-blue-600 font-bold text-sm">✓</span>}
            </button>
          )
        })}
      </div>
      <StepFooter onBack={onBack} onNext={onNext} nextDisabled={config.monitoredPlatforms.length === 0} />
    </StepWrapper>
  )
}

// ── Step 6: Review ────────────────────────────
export function Step6Review({ onFinish, onBack, config, orgName }: {
  onFinish: () => void; onBack: () => void
  config: PIIConfig; orgName: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleFinish() {
    setLoading(true)
    await onFinish()
    setLoading(false)
  }

  return (
    <StepWrapper>
      <StepHeader icon="✅" title="Review & Confirm" subtitle="Check your settings before activating SecureGPT." />
      <div className="space-y-3 max-w-md mx-auto">
        <ReviewRow label="Organisation" value={orgName || 'Not set'} />
        <ReviewRow label="Categories enabled" value={Object.entries(config.categories).filter(([, v]) => v.enabled).map(([k]) => PII_CATEGORY_LABELS[k as PIICategory]).join(', ')} />
        <ReviewRow label="Platforms monitored" value={`${config.monitoredPlatforms.length} platforms`} />
        <div className="space-y-1">
          {(Object.keys(PII_CATEGORIES) as PIICategory[]).filter((c) => config.categories[c]?.enabled).map((cat) => (
            <div key={cat} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
              <span className="text-gray-600">{PII_CATEGORY_LABELS[cat]}</span>
              <Badge variant={config.categories[cat]?.action === 'BLOCK' ? 'danger' : config.categories[cat]?.action === 'MASK' ? 'warning' : 'info'}>
                {POLICY_ACTION_LABELS[config.categories[cat]?.action as PolicyAction]}
              </Badge>
            </div>
          ))}
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={handleFinish} nextLabel="Activate SecureGPT" loading={loading} />
    </StepWrapper>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-xs">{value}</span>
    </div>
  )
}

// ── Step 7: Done ──────────────────────────────
export function Step7Done() {
  return (
    <StepWrapper>
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
          SecureGPT is now active and protecting your data on all configured AI platforms.
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-8">
          <div className="p-4 bg-red-50 rounded-xl text-sm text-red-700">
            <div className="font-semibold mb-1">🚫 Blocked</div>
            <div className="text-xs">Submission prevented when financial or confidential data is detected</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
            <div className="font-semibold mb-1">🎭 Masked</div>
            <div className="text-xs">PII replaced with safe placeholders before sending</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" size="lg" onClick={() => window.close()}>
            Start using AI tools
          </Button>
          <Button variant="secondary" size="lg" onClick={() => chrome.tabs.create({ url: 'https://securegpt.app/dashboard' })}>
            View dashboard ↗
          </Button>
        </div>
      </div>
    </StepWrapper>
  )
}
