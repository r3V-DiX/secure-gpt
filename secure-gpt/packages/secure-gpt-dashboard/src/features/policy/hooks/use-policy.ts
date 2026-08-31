'use client'
// src/features/policy/hooks/use-policy.ts
import { useState, useEffect } from 'react'
import { fetchCurrentPolicy, savePolicy, DEFAULT_POLICY_CONFIG } from '../services/policy.service'
import { useToast } from '@/contexts/toast-context'
import type { Policy, PIIConfig, CategoryConfig, PolicyAction, CustomRule, RuleOverride } from '@/types'

export function usePolicy(initialDepartmentId?: string) {
  const { toast } = useToast()
  const [departmentId, setDepartmentId] = useState<string | undefined>(initialDepartmentId)
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [config, setConfig] = useState<PIIConfig>(DEFAULT_POLICY_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const loadPolicy = async (deptId?: string) => {
    setLoading(true)
    setError(null)
    try {
      const p = await fetchCurrentPolicy(deptId)
      setPolicy(p)
      setConfig(p.config)
      setIsDirty(false)
    } catch (e: any) {
      setError(e.message)
      toast.error('Failed to load policy')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPolicy(departmentId)
  }, [departmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateCategory = (category: string, updates: Partial<CategoryConfig>) => {
    setConfig(prev => {
      const existing = prev.categories[category]
      if (!existing) return prev
      const updated: CategoryConfig = { ...existing, ...updates }
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: updated,
        },
      }
    })
    setIsDirty(true)
  }

  const addCategory = (name: string, action: PolicyAction) => {
    const categoryName = name.toUpperCase().replace(/\s+/g, '_')
    setConfig(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [categoryName]: {
          enabled: true,
          action,
          customKeywords: [],
          allowlist: [],
          fuzzyMatch: false,
          customRules: [],
        },
      },
    }))
    setIsDirty(true)
  }

  const deleteCategory = (category: string) => {
    setConfig(prev => {
      const { [category]: _, ...rest } = prev.categories
      return { ...prev, categories: rest }
    })
    setIsDirty(true)
  }

  const addCustomRule = (category: string, rule: Omit<CustomRule, 'id' | 'type'>) => {
    const id = `custom.${category.toLowerCase()}.${Date.now()}`
    setConfig(prev => {
      const cat = prev.categories[category]
      if (!cat) return prev
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            ...cat,
            customRules: [...(cat.customRules || []), { ...rule, id, type: 'custom' }],
          },
        },
      }
    })
    setIsDirty(true)
  }

  const updateCustomRule = (category: string, ruleId: string, updates: Partial<CustomRule>) => {
    setConfig(prev => {
      const cat = prev.categories[category]
      if (!cat || !cat.customRules) return prev
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            ...cat,
            customRules: cat.customRules.map(r => r.id === ruleId ? { ...r, ...updates } : r),
          },
        },
      }
    })
    setIsDirty(true)
  }

  const updateRuleOverride = (category: string, ruleId: string, override: RuleOverride) => {
    setConfig(prev => {
      const cat = prev.categories[category]
      if (!cat) return prev
      const existing = cat.ruleOverrides ?? {}
      const current = existing[ruleId] ?? {}
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            ...cat,
            ruleOverrides: {
              ...existing,
              [ruleId]: { ...current, ...override },
            },
          },
        },
      }
    })
    setIsDirty(true)
  }

  const deleteCustomRule = (category: string, ruleId: string) => {
    setConfig(prev => {
      const cat = prev.categories[category]
      if (!cat || !cat.customRules) return prev
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            ...cat,
            customRules: cat.customRules.filter(r => r.id !== ruleId),
          },
        },
      }
    })
    setIsDirty(true)
  }

  const updateField = <K extends keyof PIIConfig>(key: K, value: PIIConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const save = async (customDeptId?: string) => {
    setSaving(true)
    setError(null)
    const targetDept = customDeptId !== undefined ? customDeptId : departmentId
    try {
      const updated = await savePolicy(config, targetDept)
      setPolicy(updated)
      setConfig(updated.config)
      setSavedAt(new Date())
      setIsDirty(false)
      toast.success(`Policy v${updated.version} saved successfully`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save policy'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    if (policy) {
      setConfig(policy.config)
      setIsDirty(false)
      toast.info('Changes discarded')
    }
  }

  return {
    policy, config, loading, saving, savedAt, error, isDirty,
    departmentId, setDepartmentId, loadPolicy,
    updateCategory, addCategory, deleteCategory,
    updateRuleOverride,
    addCustomRule, updateCustomRule, deleteCustomRule,
    updateField, save, discard
  }
}