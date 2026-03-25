'use client'
// src/features/policy/hooks/use-policy.ts
import { useState, useEffect } from 'react'
import { fetchCurrentPolicy, savePolicy, DEFAULT_POLICY_CONFIG } from '../services/policy.service'
import { useToast } from '@/contexts/toast-context'
import type { Policy, PIIConfig, CategoryConfig } from '@/types'

export function usePolicy() {
  const { toast } = useToast()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [config, setConfig] = useState<PIIConfig>(DEFAULT_POLICY_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    fetchCurrentPolicy()
      .then((p) => {
        setPolicy(p)
        setConfig(p.config)
      })
      .catch((e: Error) => {
        setError(e.message)
        toast.error('Failed to load policy')
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateCategory = (category: string, updates: Partial<CategoryConfig>) => {
    setConfig(prev => {
      const existing = prev.categories[category] ?? DEFAULT_POLICY_CONFIG.categories[category]
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

  const updateField = <K extends keyof PIIConfig>(key: K, value: PIIConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await savePolicy(config)
      setPolicy(updated)
      setConfig(updated.config)
      setSavedAt(new Date())
      setIsDirty(false)
      toast.success('Policy saved successfully')
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

  return { policy, config, loading, saving, savedAt, error, isDirty, updateCategory, updateField, save, discard }
}