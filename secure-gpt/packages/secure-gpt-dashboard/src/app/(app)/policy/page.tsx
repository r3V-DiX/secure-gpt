'use client'
import { useState } from 'react'
import { usePolicy } from '@/features/policy/hooks/use-policy'
import { CategoryCard } from '@/features/policy/components/CategoryCard'
import type { PolicyAction } from '@/types'
import { ShieldCheck, Globe, Settings2, Plus, Save, Undo2, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { ACTION_LABEL, ACTION_COLORS, ACTIONS } from '@/features/policy/components/ActionSelector'
import { useAuth } from '@/contexts/auth-context'

const PLATFORMS = [
  { id: 'chatgpt',    label: 'ChatGPT',    icon: '/icons/chatgpt.png' },
  { id: 'gemini',     label: 'Gemini',     icon: '/icons/gemini.png' },
  { id: 'copilot',    label: 'Copilot',    icon: '/icons/copilot.png' },
  { id: 'claude',     label: 'Claude',     icon: '/icons/claude.png' },
  { id: 'perplexity', label: 'Perplexity', icon: '/icons/perplexity.png' },
  { id: 'meta-ai',    label: 'Meta AI',    icon: '/icons/meta-ai.png' },
]

const BUILTIN = new Set(['FINANCIAL', 'PII', 'CONFIDENTIAL', 'IP'])

// ─── Floating save bar ────────────────────────────────────────────────────────
function SaveBar({ isDirty, saving, onSave, onDiscard }: {
  isDirty: boolean; saving: boolean; onSave: () => void; onDiscard: () => void
}) {
  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 transition-all duration-300 ease-out"
      style={{
        transform: `translateX(-50%) translateY(${isDirty ? '0' : '96px'})`,
        opacity: isDirty ? 1 : 0,
        pointerEvents: isDirty ? 'auto' : 'none',
      }}
    >
      <div className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-2xl border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px var(--border)',
        }}>
        <span className="size-2 rounded-full shrink-0" style={{ background: 'var(--warning)', boxShadow: '0 0 6px var(--warning)' }} />
        <p className="text-xs font-medium pr-2" style={{ color: 'var(--text-secondary)' }}>
          {saving ? 'Publishing policy…' : 'You have unsaved changes'}
        </p>
        <button onClick={onDiscard} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 hover:bg-(--bg-surface-2)"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Undo2 size={11} /> Discard
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px var(--accent-glow)' }}>
          {saving
            ? <span className="size-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <Save size={11} />}
          {saving ? 'Saving…' : 'Save & Publish'}
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PolicyPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'super_admin' || user?.role === 'security_admin' || !user?.orgId

  const {
    config, loading, saving, savedAt, error, isDirty,
    updateCategory, addCategory, deleteCategory,
    updateRuleOverride,
    addCustomRule, updateCustomRule, deleteCustomRule,
    updateField, save, discard,
  } = usePolicy()

  const [addOpen, setAddOpen] = useState(false)

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-4xl">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const cats = Object.keys(config.categories)

  return (
    <>
      <div className="space-y-7 pb-28 animate-fade-in">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Policy Settings</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              {isAdmin
                ? 'Control how SecureGPT responds when it detects sensitive data'
                : "View the organization's active data protection policies"}
            </p>
          </div>
          {savedAt && !isDirty && isAdmin && (
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--success)' }}>
              <CheckCircle size={13} /> Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)' }}>
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* ── Detection categories ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: 'var(--accent-text)' }} />
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Detection Categories</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                {cats.length}
              </span>
            </div>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)}>
                <Plus size={13} className="mr-1" /> New Category
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cats.map((cat, i) => {
              const cfg = config.categories[cat]
              if (!cfg) return null
              return (
                <CategoryCard
                  key={cat}
                  categoryName={cat}
                  config={cfg}
                  isBuiltin={BUILTIN.has(cat)}
                  animDelay={i * 60}
                  readOnly={!isAdmin}
                  onToggleEnabled={enabled => updateCategory(cat, { enabled })}
                  onActionChange={action => updateCategory(cat, { action })}
                  onRuleOverride={(ruleId, override) => updateRuleOverride(cat, ruleId, override)}
                  onAddKeyword={kw => updateCategory(cat, { customKeywords: [...(cfg.customKeywords ?? []), kw] })}
                  onRemoveKeyword={kw => updateCategory(cat, { customKeywords: (cfg.customKeywords ?? []).filter(k => k !== kw) })}
                  onAddAllowlist={p => updateCategory(cat, { allowlist: [...(cfg.allowlist ?? []), p] })}
                  onRemoveAllowlist={p => updateCategory(cat, { allowlist: (cfg.allowlist ?? []).filter(k => k !== p) })}
                  onAddCustomRule={rule => addCustomRule(cat, rule)}
                  onUpdateCustomRule={(ruleId, rule) => updateCustomRule(cat, ruleId, rule)}
                  onDeleteCustomRule={ruleId => deleteCustomRule(cat, ruleId)}
                  onDelete={() => deleteCategory(cat)}
                />
              )
            })}
          </div>
        </section>

        {/* ── Platforms ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={15} style={{ color: 'var(--accent-text)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Monitored Platforms</h2>
          </div>
          <div className="rounded-2xl border p-5"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
              SecureGPT will scan your messages on the selected AI platforms before sending.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {PLATFORMS.map(p => {
                const on = config.monitoredPlatforms.includes(p.id)
                return (
                  <button key={p.id}
                    onClick={isAdmin ? () => {
                      const next = on
                        ? config.monitoredPlatforms.filter(x => x !== p.id)
                        : [...config.monitoredPlatforms, p.id]
                      updateField('monitoredPlatforms', next)
                    } : undefined}
                    className={`relative flex flex-col items-center justify-center gap-2.5 py-4 rounded-xl border-2 transition-all ${isAdmin ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default'}`}
                    style={{
                      background: on ? 'var(--accent-light)' : 'var(--bg-surface-2)',
                      borderColor: on ? 'var(--accent)' : 'var(--border)',
                      boxShadow: on ? '0 0 12px rgba(var(--accent-rgb), 0.15)' : 'none',
                      opacity: on ? 1 : 0.55,
                    }}>
                    {on && (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full"
                        style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent-glow)' }} />
                    )}
                    <img src={p.icon} alt="" className="size-7 object-contain" style={{ filter: on ? 'none' : 'grayscale(30%)' }} />
                    <span className="text-[11px] font-bold tracking-wide" style={{ color: on ? 'var(--accent-text)' : 'var(--text-secondary)' }}>
                      {p.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Global options ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={15} style={{ color: 'var(--accent-text)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>General Settings</h2>
          </div>
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
            {([
              { key: 'allowPause' as const, label: 'Allow users to pause protection', desc: 'Users can temporarily disable SecureGPT without contacting an admin' },
              { key: 'logUserEmail' as const, label: 'Include email in audit logs', desc: "Audit entries will contain the user's email address for traceability" },
            ]).map(({ key, label, desc }, i) => (
              <div key={key}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${isAdmin ? 'cursor-pointer hover:bg-(--bg-surface-2)' : 'cursor-default'}`}
                style={{ borderBottom: i === 0 ? '1px solid var(--border)' : undefined }}
                onClick={isAdmin ? () => updateField(key, !config[key]) : undefined}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
                </div>
                <div className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0 pointer-events-none"
                  style={{ background: config[key] ? 'var(--accent)' : 'var(--bg-surface-3)' }}>
                  <span className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                    style={{ transform: config[key] ? 'translateX(20px)' : 'translateX(0)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isAdmin && <SaveBar isDirty={isDirty} saving={saving} onSave={save} onDiscard={discard} />}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} size="sm">
        <AddCategoryModal
          onAdd={(name, action) => { addCategory(name, action); setAddOpen(false) }}
          onClose={() => setAddOpen(false)}
        />
      </Modal>
    </>
  )
}

// ─── Add category modal ───────────────────────────────────────────────────────
function AddCategoryModal({ onAdd, onClose }: {
  onAdd: (name: string, action: PolicyAction) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [action, setAction] = useState<PolicyAction>('WARN_ALLOW')

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>New Category</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Create a custom detection category</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Name</label>
        <input autoFocus
          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm"
          style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          placeholder="e.g. Medical Records"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onAdd(name, action)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>When detected, what should happen?</label>
        <div className="space-y-2">
          {ACTIONS.map(a => {
            const ac = ACTION_COLORS[a]
            const active = action === a
            const desc: Record<PolicyAction, string> = {
              BLOCK: 'Stop the message from being sent',
              MASK: 'Replace sensitive text before sending',
              WARN_ALLOW: 'Warn the user, let them decide',
              ALLOW: 'Let it pass, log it silently',
            }
            return (
              <button key={a} onClick={() => setAction(a)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                style={{
                  background: active ? ac.bg : 'var(--bg-surface-2)',
                  borderColor: active ? ac.border : 'var(--border)',
                }}>
                <span className="text-xs font-bold w-12 shrink-0" style={{ color: ac.text }}>{ACTION_LABEL[a]}</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc[a]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant="primary" className="flex-1" onClick={() => onAdd(name, action)} disabled={!name.trim()}>
          Create
        </Button>
      </div>
    </div>
  )
}
