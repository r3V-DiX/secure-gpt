// ─────────────────────────────────────────────
// useSettings Hook
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { loadSettings, saveSettings, toggleCategory, setCategoryAction, togglePlatform, addCustomKeyword, removeCustomKeyword } from '../services/settings.service'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'

export function useSettings() {
  const [config, setConfig] = useState<PIIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    void loadSettings().then((c) => {
      setConfig(c)
      setLoading(false)
    })
  }, [])

  async function withSave(fn: () => Promise<PIIConfig>) {
    setSaving(true)
    try {
      const updated = await fn()
      setConfig(updated)
      setSavedAt(new Date())
    } finally {
      setSaving(false)
    }
  }

  return {
    config,
    loading,
    saving,
    savedAt,

    toggleCategory: (cat: PIICategory, enabled: boolean) =>
      withSave(() => toggleCategory(cat, enabled)),

    setCategoryAction: (cat: PIICategory, action: PolicyAction) =>
      withSave(() => setCategoryAction(cat, action)),

    togglePlatform: (platform: string, enabled: boolean) =>
      withSave(() => togglePlatform(platform, enabled)),

    addKeyword: (cat: PIICategory, keyword: string) =>
      withSave(() => addCustomKeyword(cat, keyword)),

    removeKeyword: (cat: PIICategory, keyword: string) =>
      withSave(() => removeCustomKeyword(cat, keyword)),

    saveAll: (c: PIIConfig) =>
      withSave(async () => { await saveSettings(c); return c }),
  }
}
