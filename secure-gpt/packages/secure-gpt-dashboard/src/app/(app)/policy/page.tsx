'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePolicy } from '@/features/policy/hooks/use-policy'
import { CategoryCard } from '@/features/policy/components/CategoryCard'
import { PlatformMonitorGrid } from '@/features/policy/components/PlatformMonitorGrid'
import { GeneralSettingsSection } from '@/features/policy/components/GeneralSettingsSection'
import { PolicyScopeSelector } from '@/features/policy/components/PolicyScopeSelector'
import { ShieldCheck, Plus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'
import { useTeam } from '@/features/team/hooks/use-team'
import { SaveBar, AddCategoryModal } from '@/features/policy/components/PolicyManager'
import type { LLMPlatform } from '@securegpt/shared/constants'

const BUILTIN = new Set(['FINANCIAL', 'PII', 'CONFIDENTIAL', 'IP'])

export default function PolicyPage() {
  const searchParams = useSearchParams()
  const queryDeptId = searchParams.get('department_id') || undefined
  const { user } = useAuth()
  const isAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'security_admin' ||
    user?.role === 'org_admin' ||
    user?.role === 'platform_super_admin' ||
    !user?.orgId

  const { departments, currentOrg } = useTeam()
  const rawStatus = String(currentOrg?.status || 'PENDING_VERIFICATION')
  const isOrgVerified =
    !user?.orgId ||
    rawStatus.toUpperCase().includes('ACTIVE') ||
    Boolean(currentOrg?.domain_verified_at)

  const {
    config,
    loading,
    saving,
    savedAt,
    error,
    isDirty,
    departmentId,
    setDepartmentId,
    updateCategory,
    addCategory,
    deleteCategory,
    updateRuleOverride,
    addCustomRule,
    updateCustomRule,
    deleteCustomRule,
    updateField,
    save,
    discard,
  } = usePolicy(queryDeptId)

  useEffect(() => {
    if (queryDeptId !== undefined && queryDeptId !== departmentId) {
      setDepartmentId(queryDeptId)
    }
  }, [queryDeptId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [addOpen, setAddOpen] = useState(false)

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in max-w-4xl">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const cats = Object.keys(config.categories)
  const activeDept = departments.find((d) => d.id === departmentId)

  return (
    <>
      <div className="space-y-7 pb-28 animate-fade-in">
        {/* ── Back to Organization / Team link ── */}
        {departmentId && (
          <div className="flex items-center gap-2">
            <Link
              href="/team"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-[var(--accent-light)] hover:text-[var(--accent)] hover:border-[var(--accent-border)]"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-2)',
                color: 'var(--text-secondary)',
              }}
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
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Policy Settings
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
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
          <PolicyScopeSelector
            departmentId={departmentId}
            departments={departments}
            activeDept={activeDept}
            onSelectScope={setDepartmentId}
          />
        )}

        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
            }}
          >
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* ── Detection categories ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: 'var(--accent-text)' }} />
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Detection Categories
              </h2>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-tertiary)' }}
              >
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
                  onToggleEnabled={(enabled) => updateCategory(cat, { enabled })}
                  onActionChange={(action) => updateCategory(cat, { action })}
                  onRuleOverride={(ruleId, override) => updateRuleOverride(cat, ruleId, override)}
                  onAddKeyword={(kw) =>
                    updateCategory(cat, { customKeywords: [...(cfg.customKeywords ?? []), kw] })
                  }
                  onRemoveKeyword={(kw) =>
                    updateCategory(cat, {
                      customKeywords: (cfg.customKeywords ?? []).filter((k) => k !== kw),
                    })
                  }
                  onAddAllowlist={(p) => updateCategory(cat, { allowlist: [...(cfg.allowlist ?? []), p] })}
                  onRemoveAllowlist={(p) =>
                    updateCategory(cat, { allowlist: (cfg.allowlist ?? []).filter((k) => k !== p) })
                  }
                  onAddCustomRule={(rule) => addCustomRule(cat, rule)}
                  onUpdateCustomRule={(ruleId, rule) => updateCustomRule(cat, ruleId, rule)}
                  onDeleteCustomRule={(ruleId) => deleteCustomRule(cat, ruleId)}
                  onDelete={() => deleteCategory(cat)}
                />
              )
            })}
          </div>
        </section>

        {/* ── Monitored AI Platforms Grid ── */}
        <PlatformMonitorGrid
          monitoredPlatforms={(config.monitoredPlatforms as LLMPlatform[]) ?? []}
          isAdmin={isAdmin}
          onChange={(platforms) => updateField('monitoredPlatforms', platforms)}
        />

        {/* ── Global options ── */}
        <GeneralSettingsSection
          config={config}
          isAdmin={isAdmin}
          onUpdateField={updateField}
        />
      </div>

      {isAdmin && (
        <SaveBar
          isDirty={isDirty}
          saving={saving}
          onSave={() => save()}
          onDiscard={() => discard()}
        />
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} size="sm">
        <AddCategoryModal
          isOrgVerified={isOrgVerified}
          onAdd={(name, action) => {
            addCategory(name, action)
            setAddOpen(false)
          }}
          onClose={() => setAddOpen(false)}
        />
      </Modal>
    </>
  )
}
