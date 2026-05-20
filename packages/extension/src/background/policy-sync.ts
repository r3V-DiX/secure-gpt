// ─────────────────────────────────────────────
// Policy Sync
// Polls backend /api/v1/extension/policy every 30s
// Uses session cookie auth — no device_token needed
// ─────────────────────────────────────────────

import { policyStorage, authStorage } from '@/lib/storage/storage'
import { API_ENDPOINTS } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import type { PIIConfig } from '@securegpt/shared/types'

const POLICY_SYNC_ALARM_NAME = 'securegpt_policy_sync_alarm'

export function startPolicySync(): void {
  // Run immediately on startup
  void syncPolicy()

  // Register background alarm (1 minute frequency)
  chrome.alarms.create(POLICY_SYNC_ALARM_NAME, {
    periodInMinutes: 1.0
  })

  // Set up alarm listener
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === POLICY_SYNC_ALARM_NAME) {
      void syncPolicy()
    }
  })
}

export function stopPolicySync(): void {
  void chrome.alarms.clear(POLICY_SYNC_ALARM_NAME)
}

export async function syncPolicy(): Promise<void> {
  try {
    const isLoggedIn = await authStorage.isLoggedIn()
    if (!isLoggedIn) return // not logged in — skip

    const currentVersion = await policyStorage.getPolicyVersion()

    // apiClient has withCredentials: true + X-Extension-Request: true
    const response = await apiClient.get<{
      success: boolean
      data: {
        version: number
        config: PIIConfig
        updatedAt: string
      }
    }>(API_ENDPOINTS.EXTENSION_POLICY, { timeout: 8000 })

    const data = response.data.data

    // Only update if new version available
    if (data.version > currentVersion) {
      await policyStorage.setPolicy(data.config, data.version)
      console.log(`[SecureGPT] Policy updated to v${data.version}`)

      // Notify all content scripts about new policy
      const tabs = await chrome.tabs.query({})
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'POLICY_UPDATED',
            policy: data.config,
          }).catch(() => {
            // Tab may not have content script — ignore
          })
        }
      }
    }
  } catch (err) {
    // Offline or backend down — use cached policy silently
    console.warn('[SecureGPT] Policy sync failed — using cached policy')
  }
}