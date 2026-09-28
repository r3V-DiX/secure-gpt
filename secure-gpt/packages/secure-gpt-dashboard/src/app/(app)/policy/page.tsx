'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePolicy } from '@/features/policy/hooks/use-policy'
import { CategoryWorkspace } from '@/features/policy/components/CategoryCard'
import { PlatformMonitorGrid, PLATFORMS } from '@/features/policy/components/PlatformMonitorGrid'
import { GeneralSettingsSection } from '@/features/policy/components/GeneralSettingsSection'
import { PolicyScopeSelector } from '@/features/policy/components/PolicyScopeSelector'
import {
  ShieldCheck,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal/modal'
import { Button } from '@/components/ui/button/button'
import { useAuth } from '@/contexts/auth-context'
import { useTeam } from '@/features/team/hooks/use-team'
import { SaveBar, AddCategoryModal } from '@/features/policy/components/PolicyManager'
import type { LLMPlatform } from '@securegpt/shared/constants'
import { BUILTIN_RULES_BY_CATEGORY } from '@securegpt/shared/constants'

import { PolicyMetricsStrip } from '@/features/policy/components/PolicyMetricsStrip'
import { PolicyHeader } from '@/features/policy/components/PolicyHeader'

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
      <div className="space-y-6 animate-fade-in max-w-6xl pb-24">
        <div className="space-y-2">
          <div className="skeleton h-8 w-64 rounded-xl" />
          <div className="skeleton h-4 w-96 rounded-lg" />
        </div>
        <div className="skeleton h-24 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-48 rounded-md" />
          ))}
        </div>
      </div>
    )
  }

  const cats = Object.keys(config.categories)
  const activeDept = departments.find((d) => d.id === departmentId)

  // Quick statistics calculation
  const totalActiveCategories = cats.filter(c => config.categories[c]?.enabled).length
  const totalMonitoredPlatforms = (config.monitoredPlatforms as LLMPlatform[])?.length ?? 0
  const totalBlockingCategories = cats.filter(c => config.categories[c]?.enabled && config.categories[c]?.action === 'BLOCK').length

  return (
    <>
      <div className="space-y-7 pb-28 animate-fade-in">
        {/* ── Page Header & Department Scope ── */}
        <PolicyHeader
          departmentId={departmentId}
          activeDept={activeDept}
          isAdmin={isAdmin}
          savedAt={savedAt}
          isDirty={isDirty}
        />

        {/* ── High-Level Policy Metrics Strip ── */}
        <PolicyMetricsStrip
          totalActiveCategories={totalActiveCategories}
          totalCategories={cats.length}
          totalBlockingCategories={totalBlockingCategories}
          totalMonitoredPlatforms={totalMonitoredPlatforms}
        />

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

        {/* ── Detection categories (Two-Pane Master-Detail Workspace) ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center p-1.5 rounded-lg border shadow-xs"
                style={{
                  background: 'var(--accent-light)',
                  borderColor: 'var(--accent-border)',
                  color: 'var(--accent)',
                }}
              >
                <Shield size={15} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Detection Categories & Rules Workspace
                </h2>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Select a category from the master list to configure enforcement actions, pattern overrides, and custom keywords.
                </p>
              </div>
            </div>

            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddOpen(true)}
                disabled={!isOrgVerified}
                title={!isOrgVerified ? 'Verify corporate domain to create custom categories' : undefined}
                className="shadow-xs cursor-pointer"
              >
                <Plus size={13} className="mr-1.5" /> New Category
              </Button>
            )}
          </div>

          <CategoryWorkspace
            categories={cats}
            configCategories={config.categories}
            isBuiltin={(cat) => BUILTIN.has(cat)}
            isAdmin={isAdmin}
            isOrgVerified={isOrgVerified}
            onToggleCategoryEnabled={(cat, enabled) => updateCategory(cat, { enabled })}
            onCategoryActionChange={(cat, action) => updateCategory(cat, { action })}
            onRuleOverride={(cat, ruleId, override) => updateRuleOverride(cat, ruleId, override)}
            onAddKeyword={(cat, kw) => {
              const prev = config.categories[cat]?.customKeywords ?? []
              updateCategory(cat, { customKeywords: [...prev, kw] })
            }}
            onRemoveKeyword={(cat, kw) => {
              const prev = config.categories[cat]?.customKeywords ?? []
              updateCategory(cat, { customKeywords: prev.filter((k) => k !== kw) })
            }}
            onAddAllowlist={(cat, p) => {
              const prev = config.categories[cat]?.allowlist ?? []
              updateCategory(cat, { allowlist: [...prev, p] })
            }}
            onRemoveAllowlist={(cat, p) => {
              const prev = config.categories[cat]?.allowlist ?? []
              updateCategory(cat, { allowlist: prev.filter((item) => item !== p) })
            }}
            onAddCustomRule={(cat, rule) => addCustomRule(cat, rule)}
            onUpdateCustomRule={(cat, ruleId, rule) => updateCustomRule(cat, ruleId, rule)}
            onDeleteCustomRule={(cat, ruleId) => deleteCustomRule(cat, ruleId)}
            onDeleteCategory={(cat) => deleteCategory(cat)}
            onOpenNewCategory={() => setAddOpen(true)}
          />
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

