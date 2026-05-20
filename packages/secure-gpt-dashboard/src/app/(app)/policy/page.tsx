'use client'
// src/app/(app)/policy/page.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button/button'
import { usePolicy } from '@/features/policy/hooks/use-policy'
import type { PolicyAction, CustomRule } from '@/types'
import { ShieldCheck, Globe, Settings2, CheckCircle, Plus, Trash2, PlusCircle, AlertCircle, X } from 'lucide-react'
import { Modal } from '@/components/ui/modal/modal'

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
  const { 
    config, loading, saving, savedAt, error, isDirty, 
    updateCategory, addCategory, deleteCategory,
    addCustomRule, updateCustomRule, deleteCustomRule,
    updateField, save, discard 
  } = usePolicy()

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [isAddRuleOpen, setIsAddRuleOpen] = useState<{ category: string } | null>(null)
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false)

  const handleDiscard = () => {
    discard()
    setIsDiscardModalOpen(false)
  }

  if (loading) {
    return (
      <div className="max-w-[820px] space-y-4 animate-fade-in">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  const categories = Object.keys(config.categories)

  return (
    <div className="max-w-[820px] space-y-6 animate-fade-in pb-8">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Policy Settings
            </h1>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse-dot"
                style={{ background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
                Unsaved Changes
              </span>
            )}
          </div>
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
            <Button variant="ghost" size="sm" onClick={() => setIsDiscardModalOpen(true)}>Discard</Button>
          )}
          <Button variant="primary" size="sm" loading={saving} onClick={save} disabled={!isDirty}>
            {saving ? 'Publishing…' : 'Save Policy'}
          </Button>
        </div>
      </div>

      <Modal 
        open={isDiscardModalOpen} 
        onClose={() => setIsDiscardModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Discard changes?
            </h3>
            <button onClick={() => setIsDiscardModalOpen(false)} style={{ color: 'var(--text-tertiary)' }}>
              <X size={18} />
            </button>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            You have unsaved modifications to your detection policy. Are you sure you want to discard them? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setIsDiscardModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDiscard}>Discard Changes</Button>
          </div>
        </div>
      </Modal>

      {error && (
        <div className="p-3 rounded-xl text-sm font-medium"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Section label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: 'var(--accent-text)' }} />
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            Detection Categories
          </p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setIsAddCategoryOpen(true)}>
          <Plus size={12} />
          Add Category
        </Button>
      </div>

      {/* Category cards */}
      <div className="space-y-4">
        {categories.map((cat, i) => {
          const cfg = config.categories[cat]
          if (!cfg) return null
          const meta = CATEGORY_META[cat] || { desc: 'Custom detection category', icon: '📁' }
          const actionColors = ACTION_COLORS[cfg.action] ?? ACTION_COLORS.ALLOW
          const actionLabel = ACTION_LABEL[cfg.action] ?? cfg.action
          const isBuiltin = !!CATEGORY_META[cat]

          return (
            <div key={cat}
              className="rounded-2xl border transition-all duration-300 animate-fade-in overflow-hidden hover:shadow-md hover:border-accent-border"
              style={{
                background: 'var(--bg-surface)',
                borderColor: cfg.enabled ? 'var(--border-2)' : 'var(--border)',
                boxShadow: cfg.enabled ? 'var(--shadow-md), 0 4px 20px -4px var(--accent-glow)' : 'var(--shadow-card)',
                opacity: cfg.enabled ? 1 : 0.75,
                animationDelay: `${i * 60}ms`,
              }}>

              <div className="p-5">
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
                        {!isBuiltin && (
                          <button 
                            onClick={() => deleteCategory(cat)}
                            className="p-1 hover:bg-danger-light rounded-md text-text-tertiary hover:text-danger transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
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
                    className="relative w-11 h-6 rounded-full transition-all duration-300 shrink-0 mt-0.5 cursor-pointer shadow-inner"
                    style={{ 
                      background: cfg.enabled ? 'var(--accent)' : 'var(--bg-surface-3)',
                      boxShadow: cfg.enabled ? '0 0 8px var(--accent-glow)' : 'none'
                    }}>
                    <span
                      className="absolute top-1 left-1 size-4 bg-white rounded-full shadow-md transition-transform duration-300 ease-out"
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

                    {/* Custom Rules Section */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold uppercase tracking-widest"
                          style={{ color: 'var(--text-tertiary)' }}>
                          Custom Rules
                        </p>
                        <button 
                          onClick={() => setIsAddRuleOpen({ category: cat })}
                          className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                        >
                          <PlusCircle size={10} />
                          Add Rule
                        </button>
                      </div>

                      {(!cfg.customRules || cfg.customRules.length === 0) ? (
                        <div className="text-[11px] py-3 text-center border-2 border-dashed rounded-xl"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                          No custom rules defined for this category
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {cfg.customRules.map(rule => (
                            <div key={rule.id} 
                              className="flex items-center justify-between p-3 rounded-xl border bg-surface-2"
                              style={{ borderColor: 'var(--border)' }}>
                              <div>
                                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{rule.label}</p>
                                <code className="text-[10px] opacity-60">{rule.pattern}</code>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-bg-surface-3"
                                  style={{ color: 'var(--text-secondary)' }}>
                                  {rule.severity}
                                </span>
                                <button 
                                  onClick={() => deleteCustomRule(cat, rule.id)}
                                  className="p-1 hover:text-danger transition-colors text-text-tertiary"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

      {/* Add Category Modal */}
      <Modal open={isAddCategoryOpen} onClose={() => setIsAddCategoryOpen(false)} size="sm">
        <AddCategoryContent 
          onAdd={(name, action) => {
            addCategory(name, action)
            setIsAddCategoryOpen(false)
          }} 
          onClose={() => setIsAddCategoryOpen(false)} 
        />
      </Modal>

      {/* Add Rule Modal */}
      <Modal open={!!isAddRuleOpen} onClose={() => setIsAddRuleOpen(null)} size="md">
        {isAddRuleOpen && (
          <AddRuleContent 
            category={isAddRuleOpen.category}
            onAdd={(rule) => {
              addCustomRule(isAddRuleOpen.category, rule)
              setIsAddRuleOpen(null)
            }}
            onClose={() => setIsAddRuleOpen(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function AddCategoryContent({ onAdd, onClose }: { onAdd: (name: string, action: PolicyAction) => void, onClose: () => void }) {
  const [name, setName] = useState('')
  const [action, setAction] = useState<PolicyAction>('MASK')

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add Custom Category</h2>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Category Name</label>
        <input 
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-all focus:ring-2"
          style={{ 
            background: 'var(--bg-surface-2)', 
            borderColor: 'var(--border)', 
            color: 'var(--text-primary)',
            '--tw-ring-color': 'var(--accent)'
          } as any}
          placeholder="e.g. Project Code"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Default Action</label>
        <div className="flex gap-2">
          {ACTIONS.map(a => {
            const isActive = action === a
            return (
              <button
                key={a}
                onClick={() => setAction(a)}
                className="flex-1 py-2 text-xs font-bold rounded-lg border transition-all"
                style={{
                  background: isActive ? 'var(--accent)' : 'var(--bg-surface-2)',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                }}
              >
                {ACTION_LABEL[a]}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={() => onAdd(name, action)} disabled={!name.trim()}>Add Category</Button>
      </div>
    </div>
  )
}

function AddRuleContent({ category, onAdd, onClose }: { category: string, onAdd: (rule: Omit<CustomRule, 'id' | 'type'>) => void, onClose: () => void }) {
  const [label, setLabel] = useState('')
  const [pattern, setPattern] = useState('')
  const [severity, setSeverity] = useState<CustomRule['severity']>('medium')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [maskingLabel, setMaskingLabel] = useState('')
  const [requireContext, setRequireContext] = useState(false)
  const [triggersStr, setTriggersStr] = useState('')

  const inputStyle = {
    background: 'var(--bg-surface-2)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    '--tw-ring-color': 'var(--accent)'
  } as any

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add Custom Rule</h2>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Adding to category: <span className="font-bold" style={{ color: 'var(--accent)' }}>{category}</span></p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Rule Label</label>
          <input 
            autoFocus
            className="w-full px-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2"
            style={inputStyle}
            placeholder="e.g. Employee ID"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
        </div>
        <div className="space-y-2 col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Regex Pattern</label>
          <input 
            className="w-full px-4 py-2 rounded-xl border outline-none text-sm font-mono transition-all focus:ring-2"
            style={inputStyle}
            placeholder="e.g. EMP-[0-9]{5}"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Severity</label>
          <select 
            className="w-full px-4 py-2 rounded-xl border outline-none text-sm appearance-none transition-all focus:ring-2"
            style={inputStyle}
            value={severity}
            onChange={e => setSeverity(e.target.value as any)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Masking Label (Optional)</label>
          <input 
            className="w-full px-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2"
            style={inputStyle}
            placeholder="e.g. EMP_ID"
            value={maskingLabel}
            onChange={e => setMaskingLabel(e.target.value)}
          />
        </div>

        {/* Triggers configuration */}
        <div className="col-span-2 space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRequireContext(!requireContext)}
              className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0"
              style={{ background: requireContext ? 'var(--accent)' : 'var(--bg-surface-3)' }}>
              <span
                className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{ transform: requireContext ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Require Context Triggers</span>
          </div>
          {requireContext && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Trigger Words (Comma Separated)</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border outline-none text-sm transition-all focus:ring-2"
                style={inputStyle}
                placeholder="e.g. Employee, Badge, ID"
                value={triggersStr}
                onChange={e => setTriggersStr(e.target.value)}
              />
            </div>
          )}
        </div>

      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0"
          style={{ background: caseSensitive ? 'var(--accent)' : 'var(--bg-surface-3)' }}>
          <span
            className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
            style={{ transform: caseSensitive ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Case Sensitive Pattern</span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={() => onAdd({ 
          label, pattern, severity, caseSensitive, maskingLabel: maskingLabel || undefined,
          enabled: true, description: '', 
          requireContext, 
          triggers: requireContext ? triggersStr.split(',').map(s => s.trim()).filter(Boolean) : []
        })} disabled={!label.trim() || !pattern.trim() || (requireContext && !triggersStr.trim())}>
          Add Rule
        </Button>
      </div>
    </div>
  )
}