'use client'
// src/app/(app)/policy/page.tsx
import { Button } from '@/components/ui/button/button'
import { usePolicy } from '@/features/policy/hooks/use-policy'
import type { PolicyAction } from '@/types'
import { ShieldCheck, Globe, Settings2, CheckCircle } from 'lucide-react'

const CATEGORIES = ['FINANCIAL', 'PII', 'CONFIDENTIAL', 'IP'] as const
const ACTIONS: PolicyAction[] = ['BLOCK', 'MASK', 'WARN_ALLOW', 'ALLOW']
const PLATFORMS = ['chatgpt', 'gemini', 'copilot', 'claude', 'perplexity', 'meta-ai']

const ACTION_LABEL: Record<PolicyAction, string> = {
  BLOCK: 'Block', MASK: 'Mask', WARN_ALLOW: 'Warn', ALLOW: 'Allow',
}

const ACTION_COLORS: Record<PolicyAction, { bg: string; border: string; text: string }> = {
  BLOCK:     { bg: 'var(--danger-light)',  border: 'var(--danger-border)',  text: 'var(--danger)' },
  MASK:      { bg: 'var(--warning-light)', border: 'var(--warning-border)', text: 'var(--warning)' },
  WARN_ALLOW:{ bg: 'var(--info-light)',    border: 'var(--info-border)',    text: 'var(--info)' },
  ALLOW:     { bg: 'var(--success-light)', border: 'var(--success-border)', text: 'var(--success)' },
}

const CATEGORY_META: Record<string, { desc: string; icon: string }> = {
  FINANCIAL:    { desc: 'Credit cards, bank accounts, tax IDs, financial data', icon: '💳' },
  PII:          { desc: 'Names, emails, phone numbers, addresses, national IDs', icon: '👤' },
  CONFIDENTIAL: { desc: 'API keys, credentials, source code, legal documents',  icon: '🔐' },
  IP:           { desc: 'Patents, roadmaps, trade secrets, internal strategies', icon: '💡' },
}

export default function PolicyPage() {
  const { config, loading, saving, savedAt, error, isDirty, updateCategory, updateField, save, discard } = usePolicy()

  if (loading) {
    return (
      <div className="max-w-[820px] space-y-4 animate-fade-in">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[820px] space-y-6 animate-fade-in pb-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Policy Settings
          </h1>
          <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            Configure how SecureGPT handles each data category
            {savedAt && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--success)' }}>
                <CheckCircle size={11} />
                Saved {savedAt.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <Button variant="ghost" size="sm" onClick={discard}>Discard</Button>
          )}
          <Button variant="primary" size="sm" loading={saving} onClick={save} disabled={!isDirty}>
            {saving ? 'Saving…' : 'Save Policy'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Section label */}
      <div className="flex items-center gap-2">
        <ShieldCheck size={14} style={{ color: 'var(--accent-text)' }} />
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
          Detection Categories
        </p>
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        {CATEGORIES.map((cat, i) => {
          const cfg = config.categories[cat]
          if (!cfg) return null
          const meta = CATEGORY_META[cat]
          const actionColors = ACTION_COLORS[cfg.action] ?? ACTION_COLORS.ALLOW
          const actionLabel = ACTION_LABEL[cfg.action] ?? cfg.action
          return (
            <div key={cat}
              className="rounded-2xl p-5 border transition-all duration-200 animate-fade-in"
              style={{
                background: 'var(--bg-surface)',
                borderColor: cfg.enabled ? 'var(--border-2)' : 'var(--border)',
                boxShadow: 'var(--shadow-card)',
                opacity: cfg.enabled ? 1 : 0.6,
                animationDelay: `${i * 60}ms`,
              }}>

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl leading-none mt-0.5">{meta?.icon}</span>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                      {cfg.enabled && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ background: actionColors.bg, borderColor: actionColors.border, color: actionColors.text }}>
                          {actionLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {meta?.desc}
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => updateCategory(cat, { enabled: !cfg.enabled })}
                  className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0 mt-0.5"
                  style={{ background: cfg.enabled ? 'var(--accent)' : 'var(--bg-surface-3)' }}>
                  <span
                    className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                    style={{ transform: cfg.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>

              {cfg.enabled && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5"
                    style={{ color: 'var(--text-tertiary)' }}>
                    Action on detection
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {ACTIONS.map(action => {
                      const ac = ACTION_COLORS[action] ?? ACTION_COLORS.ALLOW
                      const label = ACTION_LABEL[action] ?? action
                      const isActive = cfg.action === action
                      return (
                        <button
                          key={action}
                          onClick={() => updateCategory(cat, { action })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                          style={{
                            background: isActive ? ac.bg : 'var(--bg-surface-2)',
                            borderColor: isActive ? ac.border : 'var(--border)',
                            color: isActive ? ac.text : 'var(--text-secondary)',
                          }}>
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Platforms */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={14} style={{ color: 'var(--accent-text)' }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Monitored Platforms
          </p>
        </div>
        <div className="rounded-2xl p-5 border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Select which AI platforms SecureGPT actively monitors
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => {
              const active = config.monitoredPlatforms.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => {
                    const updated = active
                      ? config.monitoredPlatforms.filter(x => x !== p)
                      : [...config.monitoredPlatforms, p]
                    updateField('monitoredPlatforms', updated)
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all"
                  style={{
                    background: active ? 'var(--accent-light)' : 'var(--bg-surface-2)',
                    borderColor: active ? 'var(--accent-border)' : 'var(--border)',
                    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                  }}>
                  {p}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Global options */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Settings2 size={14} style={{ color: 'var(--accent-text)' }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Global Options
          </p>
        </div>
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
          {[
            { key: 'allowPause' as const, label: 'Allow pause', desc: 'Let the extension be temporarily paused by the user' },
            { key: 'logUserEmail' as const, label: 'Log user email', desc: 'Include your email address in audit logs' },
          ].map(({ key, label, desc }, i) => (
            <div key={key}
              className="flex items-center justify-between gap-4 px-5 py-4"
              style={{ borderBottom: i === 0 ? '1px solid var(--border)' : undefined }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
              </div>
              <button
                onClick={() => updateField(key, !config[key])}
                className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0"
                style={{ background: config[key] ? 'var(--accent)' : 'var(--bg-surface-3)' }}>
                <span
                  className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                  style={{ transform: config[key] ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}