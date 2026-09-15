'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePolicy } from '@/features/policy/hooks/use-policy'
import { CategoryCard } from '@/features/policy/components/CategoryCard'
import type { PolicyAction } from '@/types'
import { ShieldCheck, Globe, Settings2, Plus, Save, Undo2, CheckCircle, AlertCircle, Building2, Layers, ArrowLeft, Search, CheckSquare, Square } from 'lucide-react'
import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { ACTION_LABEL, ACTION_COLORS, ACTIONS } from '@/features/policy/components/ActionSelector'
import { useAuth } from '@/contexts/auth-context'
import { useTeam } from '@/features/team/hooks/use-team'
import { PlatformIcon } from '@/components/shared/PlatformIcon'
import { ALL_PLATFORMS, type LLMPlatform } from '@securegpt/shared/constants'

interface PlatformMeta {
  id: LLMPlatform
  label: string
  category: 'chat' | 'code' | 'writing'
  domain: string
}

const PLATFORMS: PlatformMeta[] = [
  { id: 'chatgpt',    label: 'ChatGPT',           category: 'chat',    domain: 'chatgpt.com' },
  { id: 'claude',     label: 'Claude (Anthropic)', category: 'chat',    domain: 'claude.ai' },
  { id: 'gemini',     label: 'Google Gemini',     category: 'chat',    domain: 'gemini.google.com' },
  { id: 'copilot',    label: 'Microsoft Copilot', category: 'chat',    domain: 'copilot.microsoft.com' },
  { id: 'perplexity', label: 'Perplexity AI',     category: 'chat',    domain: 'perplexity.ai' },
  { id: 'deepseek',   label: 'DeepSeek',          category: 'chat',    domain: 'deepseek.com' },
  { id: 'mistral',    label: 'Mistral Le Chat',   category: 'chat',    domain: 'chat.mistral.ai' },
  { id: 'meta-ai',    label: 'Meta AI',           category: 'chat',    domain: 'meta.ai' },
  { id: 'poe',        label: 'Poe',               category: 'chat',    domain: 'poe.com' },
  { id: 'cursor',     label: 'Cursor Web',        category: 'code',    domain: 'cursor.com' },
  { id: 'v0',         label: 'v0.dev (Vercel)',   category: 'code',    domain: 'v0.dev' },
  { id: 'replit',     label: 'Replit Agent',      category: 'code',    domain: 'replit.com' },
  { id: 'huggingchat',label: 'HuggingChat',       category: 'code',    domain: 'huggingface.co' },
  { id: 'phind',      label: 'Phind AI',          category: 'code',    domain: 'phind.com' },
  { id: 'notion',     label: 'Notion AI',         category: 'writing', domain: 'notion.so' },
  { id: 'jasper',     label: 'Jasper AI',         category: 'writing', domain: 'jasper.ai' },
  { id: 'copy-ai',    label: 'Copy.ai',           category: 'writing', domain: 'copy.ai' },
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
        <button onClick={() => onDiscard()} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 hover:bg-(--bg-surface-2)"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Undo2 size={11} /> Discard
        </button>
        <button onClick={() => onSave()} disabled={saving}
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
  const searchParams = useSearchParams()
  const queryDeptId = searchParams.get('department_id') || undefined
  const { user } = useAuth()
  const isAdmin = user?.role === 'super_admin' || user?.role === 'security_admin' || user?.role === 'org_admin' || user?.role === 'platform_super_admin' || !user?.orgId
  const { departments, currentOrg } = useTeam()
  const rawStatus = String(currentOrg?.status || 'PENDING_VERIFICATION')
  const isOrgVerified = !user?.orgId || rawStatus.toUpperCase().includes('ACTIVE') || Boolean(currentOrg?.domain_verified_at)

  const {
    config, loading, saving, savedAt, error, isDirty,
    departmentId, setDepartmentId,
    updateCategory, addCategory, deleteCategory,
    updateRuleOverride,
    addCustomRule, updateCustomRule, deleteCustomRule,
    updateField, save, discard,
  } = usePolicy(queryDeptId)

  useEffect(() => {
    if (queryDeptId !== undefined && queryDeptId !== departmentId) {
      setDepartmentId(queryDeptId)
    }
  }, [queryDeptId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [addOpen, setAddOpen] = useState(false)
  const [platformCategory, setPlatformCategory] = useState<'all' | 'chat' | 'code' | 'writing'>('all')
  const [platformSearch, setPlatformSearch] = useState('')

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
  const activeDept = departments.find(d => d.id === departmentId)

  return (
    <>
      <div className="space-y-7 pb-28 animate-fade-in">

        {/* ── Back to Organization / Team link ── */}
        {departmentId && (
          <div className="flex items-center gap-2">
            <Link
              href="/team"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-[var(--accent-light)] hover:text-[var(--accent)] hover:border-[var(--accent-border)]"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={13} /> ← Back to Team & Organization
            </Link>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
              Department Override Scope: {activeDept?.name || departmentId}
            </span>
          </div>
        )}

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* ── Department / Policy Scope Selector ── */}
        {user?.orgId && (
          <div className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
            <div>
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Policy Governance Scope
                </span>
              </div>
              <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
                {departmentId
                  ? `Editing specialized DLP rules for the "${activeDept?.name || 'Department'}" category.`
                  : 'Editing company-wide organization baseline DLP policy.'}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setDepartmentId(undefined)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  !departmentId
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                🏢 Org Baseline
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setDepartmentId(dept.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    departmentId === dept.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  📁 {dept.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddOpen(true)}
                disabled={!isOrgVerified}
                title={!isOrgVerified ? 'Verify corporate domain to create custom categories' : undefined}
              >
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Globe size={15} style={{ color: 'var(--accent-text)' }} />
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Monitored Platforms</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}>
                {(config.monitoredPlatforms as string[]).length} / {PLATFORMS.length} active
              </span>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateField('monitoredPlatforms', PLATFORMS.map(p => p.id))}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <CheckSquare size={12} /> Select All
                </button>
                <button
                  type="button"
                  onClick={() => updateField('monitoredPlatforms', [])}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:bg-[var(--danger-light)] hover:text-[var(--danger)]"
                  style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <Square size={12} /> Deselect All
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-5 space-y-4"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-2)', boxShadow: 'var(--shadow-card)' }}>
            
            {/* Filter controls: Category tabs + search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Platforms (17)' },
                  { id: 'chat', label: 'Chatbots & General AI (9)' },
                  { id: 'code', label: 'Coding & Dev AI (5)' },
                  { id: 'writing', label: 'Enterprise & Writing (3)' },
                ].map(tab => {
                  const active = platformCategory === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPlatformCategory(tab.id as any)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                          : 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="relative min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search platforms…"
                  value={platformSearch}
                  onChange={e => setPlatformSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border bg-[var(--bg-surface-2)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            {/* Platform Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {PLATFORMS
                .filter(p => platformCategory === 'all' || p.category === platformCategory)
                .filter(p => !platformSearch || p.label.toLowerCase().includes(platformSearch.toLowerCase()) || p.domain.toLowerCase().includes(platformSearch.toLowerCase()))
                .map(p => {
                  const on = (config.monitoredPlatforms as string[]).includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={isAdmin ? () => {
                        const next = on
                          ? config.monitoredPlatforms.filter(x => x !== p.id)
                          : [...config.monitoredPlatforms, p.id as any]
                        updateField('monitoredPlatforms', next)
                      } : undefined}
                      className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                        isAdmin ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : 'cursor-default'
                      } ${on ? 'shadow-xs' : 'opacity-65'}`}
                      style={{
                        background: on ? 'var(--accent-light)' : 'var(--bg-surface-2)',
                        borderColor: on ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      <PlatformIcon platformId={p.id} size={32} className="shrink-0 rounded-lg shadow-sm" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-bold truncate" style={{ color: on ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                            {p.label}
                          </p>
                          <span className={`text-[9.5px] font-mono uppercase px-1.5 py-0.5 rounded-md font-bold shrink-0 border ${
                            on
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-[var(--bg-surface-3)] text-[var(--text-muted)] border-[var(--border)]'
                          }`}>
                            {on ? 'Protected' : 'Off'}
                          </span>
                        </div>
                        <p className="text-[10.5px] truncate font-mono" style={{ color: 'var(--text-tertiary)' }}>
                          {p.domain}
                        </p>
                      </div>
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
              { key: 'enableDocumentScanning' as const, label: 'Document & File Scanning', desc: 'Inspect and redact sensitive data in uploaded PDF, Office documents, and images' },
              { key: 'allowPause' as const, label: 'Allow users to pause protection', desc: 'Users can temporarily disable SecureGPT without contacting an admin' },
              { key: 'logUserEmail' as const, label: 'Include email in audit logs', desc: "Audit entries will contain the user's email address for traceability" },
            ]).map(({ key, label, desc }, i) => (
              <div key={key}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${isAdmin ? 'cursor-pointer hover:bg-(--bg-surface-2)' : 'cursor-default'}`}
                style={{ borderBottom: i < 2 ? '1px solid var(--border)' : undefined }}
                onClick={isAdmin ? () => updateField(key as any, !(config as any)[key]) : undefined}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
                </div>
                <div className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0 pointer-events-none"
                  style={{ background: (config as any)[key] !== false ? 'var(--accent)' : 'var(--bg-surface-3)' }}>
                  <span className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow-sm transition-transform duration-200"
                    style={{ transform: (config as any)[key] !== false ? 'translateX(20px)' : 'translateX(0)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isAdmin && <SaveBar isDirty={isDirty} saving={saving} onSave={() => save()} onDiscard={() => discard()} />}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} size="sm">
        <AddCategoryModal
          isOrgVerified={isOrgVerified}
          onAdd={(name, action) => { addCategory(name, action); setAddOpen(false) }}
          onClose={() => setAddOpen(false)}
        />
      </Modal>
    </>
  )
}

// ─── Add category modal ───────────────────────────────────────────────────────
function AddCategoryModal({ isOrgVerified = true, onAdd, onClose }: {
  isOrgVerified?: boolean
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

      {!isOrgVerified && (
        <div
          className="p-3.5 text-xs rounded-xl flex items-start gap-2.5"
          style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Domain Verification Required</p>
            <p className="mt-0.5 text-[11px] opacity-90">
              You cannot add custom detection categories until your corporate domain is verified.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Name</label>
        <input autoFocus
          disabled={!isOrgVerified}
          className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          placeholder="e.g. Medical Records"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && isOrgVerified && onAdd(name, action)}
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
                disabled={!isOrgVerified}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        <Button variant="primary" className="flex-1" onClick={() => onAdd(name, action)} disabled={!name.trim() || !isOrgVerified}>
          Create
        </Button>
      </div>
    </div>
  )
}
