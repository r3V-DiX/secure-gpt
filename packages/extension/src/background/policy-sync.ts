// ─────────────────────────────────────────────
// Policy Sync
// Polls backend for latest org policy every 15 min
// ─────────────────────────────────────────────

import axios from 'axios'
import { policyStorage, authStorage } from '@/lib/storage/storage'
import { API_BASE_URL, POLICY_SYNC_INTERVAL_MS, API_ENDPOINTS } from '@/config/api.config'
import type { PIIConfig } from '@securegpt/shared/types'

let syncIntervalId: ReturnType<typeof setInterval> | null = null

export function startPolicySync(): void {
  // Run immediately on startup
  void syncPolicy()

  // Then every 15 minutes
  syncIntervalId = setInterval(() => {
    void syncPolicy()
  }, POLICY_SYNC_INTERVAL_MS)
}

export function stopPolicySync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId)
    syncIntervalId = null
  }
}

async function syncPolicy(): Promise<void> {
  try {
    const auth = await authStorage.getAuth()
    if (!auth) return // Not logged in — skip

    const currentVersion = await policyStorage.getPolicyVersion()

    const response = await axios.get(
      `${API_BASE_URL}${API_ENDPOINTS.POLICY_DEVICE(auth.user.orgId)}`,
      {
        params: { device_token: auth.deviceToken },
        timeout: 8000,
      }
    )

    const data = response.data?.data as {
      version: number
      config: PIIConfig
      updated_at: string
    }

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
  } catch (error) {
    // Offline or backend down — use cached policy
    console.warn('[SecureGPT] Policy sync failed — using cached policy')
  }
}
