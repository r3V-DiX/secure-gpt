// ─────────────────────────────────────────────
// Settings Service
// Load and save user policy config
// ─────────────────────────────────────────────

import { policyStorage } from '@/lib/storage/storage'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory, PolicyAction } from '@securegpt/shared/constants'

export async function loadSettings(): Promise<PIIConfig> {
  return (await policyStorage.getPolicy()) ?? DEFAULT_EXTENSION_CONFIG
}

export async function saveSettings(config: PIIConfig): Promise<void> {
  const version = (await policyStorage.getPolicyVersion()) + 1
  await policyStorage.setPolicy(config, version)

  // Notify background to push updated policy to content scripts
  chrome.runtime.sendMessage({ type: 'POLICY_UPDATED', policy: config })
}

export async function toggleCategory(
  category: PIICategory,
  enabled: boolean
): Promise<PIIConfig> {
  const config = await loadSettings()
  config.categories[category].enabled = enabled
  await saveSettings(config)
  return config
}

export async function setCategoryAction(
  category: PIICategory,
  action: PolicyAction
): Promise<PIIConfig> {
  const config = await loadSettings()
  config.categories[category].action = action
  await saveSettings(config)
  return config
}

export async function addCustomKeyword(
  category: PIICategory,
  keyword: string
): Promise<PIIConfig> {
  const config = await loadSettings()
  const existing = config.categories[category].customKeywords ?? []
  if (!existing.includes(keyword)) {
    config.categories[category].customKeywords = [...existing, keyword]
    await saveSettings(config)
  }
  return config
}

export async function removeCustomKeyword(
  category: PIICategory,
  keyword: string
): Promise<PIIConfig> {
  const config = await loadSettings()
  config.categories[category].customKeywords =
    (config.categories[category].customKeywords ?? []).filter((k) => k !== keyword)
  await saveSettings(config)
  return config
}

export async function togglePlatform(
  platform: string,
  enabled: boolean
): Promise<PIIConfig> {
  const config = await loadSettings()
  if (enabled) {
    if (!config.monitoredPlatforms.includes(platform as never)) {
      config.monitoredPlatforms = [...config.monitoredPlatforms, platform as never]
    }
  } else {
    config.monitoredPlatforms = config.monitoredPlatforms.filter((p) => p !== platform)
  }
  await saveSettings(config)
  return config
}
