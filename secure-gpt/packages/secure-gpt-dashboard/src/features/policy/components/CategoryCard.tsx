'use client'

import { useState } from 'react'
import { ACTION_COLORS } from './ActionSelector'
import { Modal } from '@/components/ui/modal/modal'
import type { CategoryConfig, PolicyAction, CustomRule, RuleOverride } from '@/types'
import { BUILTIN_RULES_BY_CATEGORY } from '@securegpt/shared/constants'
import { AddEditRuleModal } from './PolicyManager'
import { CardIcon, UserProfileIcon, SecurityLock, IdeaIcon } from '@/components/icons'
import { CategoryNavList } from './CategoryNavList'
import { CategoryDetailPane } from './CategoryDetailPane'

export const CATEGORY_META: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
  FINANCIAL: {
    icon: <CardIcon size={18} className="text-[var(--accent)]" />,
    title: 'Financial & Payment Data',
    desc: 'Credit cards, IBANs, bank accounts, routing numbers, and cryptowallets',
  },
  PII: {
    icon: <UserProfileIcon size={18} className="text-[var(--info)]" />,
    title: 'Personally Identifiable Info',
    desc: 'Social security numbers, passports, phone numbers, emails, and full names',
  },
  CONFIDENTIAL: {
    icon: <SecurityLock size={18} className="text-[var(--warning)]" />,
    title: 'Secrets & API Credentials',
    desc: 'API keys, private RSA certificates, JWT tokens, and database credentials',
  },
  IP: {
    icon: <IdeaIcon size={18} className="text-[var(--violet)]" />,
    title: 'Intellectual Property & Code',
    desc: 'Proprietary source code, internal schemas, patents, and internal trade secrets',
  },
}

interface PolicyWorkspaceProps {
  categories: string[]
  configCategories: Record<string, CategoryConfig>
  isBuiltin: (cat: string) => boolean
  isAdmin: boolean
  isOrgVerified: boolean
  onToggleCategoryEnabled: (cat: string, enabled: boolean) => void
  onCategoryActionChange: (cat: string, action: PolicyAction) => void
  onRuleOverride: (cat: string, ruleId: string, override: RuleOverride) => void
  onAddKeyword: (cat: string, keyword: string) => void
  onRemoveKeyword: (cat: string, keyword: string) => void
  onAddAllowlist: (cat: string, pattern: string) => void
  onRemoveAllowlist: (cat: string, pattern: string) => void
  onAddCustomRule: (cat: string, rule: Omit<CustomRule, 'id' | 'type'>) => void
  onUpdateCustomRule: (cat: string, ruleId: string, rule: Omit<CustomRule, 'id' | 'type'>) => void
  onDeleteCustomRule: (cat: string, ruleId: string) => void
  onDeleteCategory: (cat: string) => void
  onOpenNewCategory: () => void
}

export function CategoryWorkspace(props: PolicyWorkspaceProps) {
  const {
    categories,
    configCategories,
    isBuiltin,
    isAdmin,
    isOrgVerified,
    onToggleCategoryEnabled,
    onCategoryActionChange,
    onRuleOverride,
    onAddKeyword,
    onRemoveKeyword,
    onAddAllowlist,
    onRemoveAllowlist,
    onAddCustomRule,
    onUpdateCustomRule,
    onDeleteCustomRule,
    onDeleteCategory,
    onOpenNewCategory,
  } = props

  const [selectedCat, setSelectedCat] = useState<string>(categories[0] || 'FINANCIAL')
  const [activeTab, setActiveTab] = useState<'rules' | 'keywords' | 'custom'>('rules')
  const [addRuleOpen, setAddRuleOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CustomRule | undefined>(undefined)
  const [kwDraft, setKwDraft] = useState('')
  const [allowDraft, setAllowDraft] = useState('')

  const activeCategoryName = categories.includes(selectedCat) ? selectedCat : categories[0]
  const cfg = configCategories[activeCategoryName]

  const meta = CATEGORY_META[activeCategoryName] ?? {
    icon: '📁',
    title: activeCategoryName,
    desc: 'Custom detection rules for organization data protection',
  }

  const builtinRules = BUILTIN_RULES_BY_CATEGORY[activeCategoryName] ?? []
  const customRules = cfg?.customRules ?? []
  const keywords = cfg?.customKeywords ?? []
  const allowlist = cfg?.allowlist ?? []
  const ac = cfg ? ACTION_COLORS[cfg.action] : ACTION_COLORS.BLOCK

  const totalBuiltin = builtinRules.length
  const disabledBuiltinCount = builtinRules.filter(
    (r) => cfg?.ruleOverrides?.[r.id]?.enabled === false
  ).length
  const activeBuiltinCount = totalBuiltin - disabledBuiltinCount
  const totalActiveFields = activeBuiltinCount + customRules.filter((r) => r.enabled !== false).length

  return (
    <>
      <div
        className="rounded-md border overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <CategoryNavList
          categories={categories}
          configCategories={configCategories}
          activeCategoryName={activeCategoryName}
          setSelectedCat={setSelectedCat}
          onToggleCategoryEnabled={onToggleCategoryEnabled}
          isAdmin={isAdmin}
          isOrgVerified={isOrgVerified}
          onAddCategoryClick={onOpenNewCategory}
          categoryMeta={CATEGORY_META}
          builtinRulesByCategory={BUILTIN_RULES_BY_CATEGORY}
        />

        <CategoryDetailPane
          cfg={cfg}
          meta={meta}
          activeCategoryName={activeCategoryName}
          ac={ac}
          totalActiveFields={totalActiveFields}
          isBuiltin={isBuiltin}
          isAdmin={isAdmin}
          onDeleteCategory={onDeleteCategory}
          onCategoryActionChange={onCategoryActionChange}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          builtinRules={builtinRules}
          onRuleOverride={onRuleOverride}
          keywords={keywords}
          kwDraft={kwDraft}
          setKwDraft={setKwDraft}
          onAddKeyword={onAddKeyword}
          onRemoveKeyword={onRemoveKeyword}
          allowlist={allowlist}
          allowDraft={allowDraft}
          setAllowDraft={setAllowDraft}
          onAddAllowlist={onAddAllowlist}
          onRemoveAllowlist={onRemoveAllowlist}
          customRules={customRules}
          setEditingRule={setEditingRule}
          setAddRuleOpen={setAddRuleOpen}
          onDeleteCustomRule={onDeleteCustomRule}
        />
      </div>

      <Modal open={addRuleOpen} onClose={() => { setAddRuleOpen(false); setEditingRule(undefined) }} size="sm">
        <AddEditRuleModal
          category={activeCategoryName}
          initialRule={editingRule}
          onSave={(ruleData) => {
            if (editingRule) {
              onUpdateCustomRule(activeCategoryName, editingRule.id, ruleData)
            } else {
              onAddCustomRule(activeCategoryName, ruleData)
            }
            setAddRuleOpen(false)
            setEditingRule(undefined)
          }}
          onClose={() => { setAddRuleOpen(false); setEditingRule(undefined) }}
        />
      </Modal>
    </>
  )
}
