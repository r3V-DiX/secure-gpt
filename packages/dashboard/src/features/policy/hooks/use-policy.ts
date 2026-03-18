'use client'

import { useState, useEffect } from 'react'
import { fetchCurrentPolicy, updatePolicy } from '../services/policy.service'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'

export function usePolicy() {
  const [config, setConfig] = useState<PIIConfig>(DEFAULT_PII_CONFIG)
  const [version, setVersion] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCurrentPolicy()
      .then(({ config: c, version: v }) => { setConfig(c); setVersion(v) })
      .catch(() => setError('Failed to load policy'))
      .finally(() => setLoading(false))
  }, [])

  async function save(newConfig: PIIConfig) {
    setSaving(true)
    try {
      await updatePolicy(newConfig)
      setConfig(newConfig)
      setSavedAt(new Date())
      setVersion((v) => v + 1)
    } catch {
      setError('Failed to save policy')
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(category: PIICategory, enabled: boolean) {
    const updated = { ...config, categories: { ...config.categories, [category]: { ...config.categories[category], enabled } } }
    setConfig(updated)
  }

  function setCategoryAction(category: PIICategory, action: PolicyAction) {
    const updated = { ...config, categories: { ...config.categories, [category]: { ...config.categories[category], action } } }
    setConfig(updated)
  }

  return { config, version, loading, saving, savedAt, error, save, toggleCategory, setCategoryAction }
}
