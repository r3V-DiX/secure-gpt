// ─────────────────────────────────────────────
// Policy Sync
// Primary: SSE stream from backend /api/v1/extension/policy/stream
// Fallback: chrome.alarms poll every 60s if SSE is unavailable or disconnects
// ─────────────────────────────────────────────

import { policyStorage, authStorage } from '@/lib/storage/storage'
import { API_ENDPOINTS, DASHBOARD_URL } from '@/config/api.config'
import { PLATFORM_DOMAINS } from '@securegpt/shared/constants'
import apiClient from '@/lib/api/client'
import { sendDeviceHeartbeat } from '@/features/auth/services/auth.service'
import type { PIIConfig } from '@securegpt/shared/types'

const FALLBACK_ALARM_NAME = 'securegpt-policy-fallback'
const HEARTBEAT_ALARM_NAME = 'securegpt-device-heartbeat'
// Minimum alarm period Chrome allows is 1 minute
const FALLBACK_ALARM_PERIOD_MIN = 1
const HEARTBEAT_ALARM_PERIOD_MIN = 2
const SSE_RETRY_DELAY_MS = 5 * 1000

const LLM_URL_PATTERNS: string[] = Object.values(PLATFORM_DOMAINS)
  .flatMap((d) => (Array.isArray(d) ? d : [d]))
  .map((hostname) => `https://${hostname}/*`)

let sseAbortController: AbortController | null = null
let stopped = false

export function startPolicySync(): void {
  stopped = false
  // Register the alarm listener once — safe to call multiple times as Chrome
  // deduplicates listeners registered in the same service worker context.
  chrome.alarms.onAlarm.addListener(handleAlarm)
  
  // Register periodic device heartbeat alarm
  chrome.alarms.get(HEARTBEAT_ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(HEARTBEAT_ALARM_NAME, {
        periodInMinutes: HEARTBEAT_ALARM_PERIOD_MIN,
      })
    }
  })
  void sendDeviceHeartbeat()
  void connectSSE()
}

export function stopPolicySync(): void {
  stopped = true
  sseAbortController?.abort()
  sseAbortController = null
  void chrome.alarms.clear(FALLBACK_ALARM_NAME)
  void chrome.alarms.clear(HEARTBEAT_ALARM_NAME)
}

function handleAlarm(alarm: chrome.alarms.Alarm): void {
  if (alarm.name === FALLBACK_ALARM_NAME) {
    void pollOnce()
  } else if (alarm.name === HEARTBEAT_ALARM_NAME) {
    void sendDeviceHeartbeat()
  }
}

// ── SSE connection ────────────────────────────────────────────────────────────

async function connectSSE(): Promise<void> {
  if (stopped) return

  const isLoggedIn = await authStorage.isLoggedIn()
  if (!isLoggedIn) {
    scheduleFallbackAlarm()
    return
  }

  sseAbortController?.abort()
  sseAbortController = new AbortController()

  try {
    const url = `${DASHBOARD_URL}${API_ENDPOINTS.EXTENSION_POLICY}/stream`
    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'X-Extension-Request': 'true' },
      signal: sseAbortController.signal,
    })

    if (!response.ok || !response.body) {
      throw new Error(`SSE connect failed: ${response.status}`)
    }

    stopFallbackAlarm() // SSE is up — no need to poll

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const messages = buffer.split('\n\n')
      buffer = messages.pop() ?? ''

      for (const block of messages) {
        await handleSSEBlock(block)
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return
    console.warn('[SecureGPT] SSE disconnected — retrying in', SSE_RETRY_DELAY_MS / 1000, 's')
  }

  if (!stopped) {
    // While reconnecting, start fallback alarm so policy isn't stale
    scheduleFallbackAlarm()
    setTimeout(() => void connectSSE(), SSE_RETRY_DELAY_MS)
  }
}

async function handleSSEBlock(block: string): Promise<void> {
  let eventType = 'message'
  let dataLine = ''

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) eventType = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLine = line.slice(5).trim()
  }

  if (eventType !== 'policy' || !dataLine) return

  try {
    const data = JSON.parse(dataLine) as { version: number; config: PIIConfig; updatedAt: string }
    await applyPolicyUpdate(data)
  } catch {
    console.warn('[SecureGPT] Failed to parse SSE policy payload')
  }
}

// Public one-shot sync — used by SYNC_POLICY message handler
export async function forcePolicySync(): Promise<void> {
  await pollOnce()
}

// ── Fallback alarm ────────────────────────────────────────────────────────────

function scheduleFallbackAlarm(): void {
  if (stopped) return
  // Do an immediate poll, then schedule periodic alarm
  void pollOnce()
  chrome.alarms.get(FALLBACK_ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(FALLBACK_ALARM_NAME, {
        periodInMinutes: FALLBACK_ALARM_PERIOD_MIN,
      })
    }
  })
}

function stopFallbackAlarm(): void {
  void chrome.alarms.clear(FALLBACK_ALARM_NAME)
}

async function pollOnce(): Promise<void> {
  try {
    const isLoggedIn = await authStorage.isLoggedIn()
    if (!isLoggedIn) return

    const response = await apiClient.get<{
      success: boolean
      data: { version: number; config: PIIConfig; updatedAt: string }
    }>(API_ENDPOINTS.EXTENSION_POLICY, { timeout: 8000 })

    await applyPolicyUpdate(response.data.data)
  } catch {
    console.warn('[SecureGPT] Fallback policy poll failed — using cached policy')
  }
}

// ── Shared apply logic ────────────────────────────────────────────────────────

async function applyPolicyUpdate(data: { version: number; config: PIIConfig; updatedAt: string }): Promise<void> {
  const currentVersion = await policyStorage.getPolicyVersion()

  if (data.version >= currentVersion) {
    await policyStorage.setPolicy(data.config, data.version)
    if (data.version > currentVersion) {
      console.log(`[SecureGPT] Policy updated to v${data.version}`)
    }

    const tabs = await chrome.tabs.query({ url: LLM_URL_PATTERNS })
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'POLICY_UPDATED',
          policy: data.config,
        }).catch(() => {})
      }
    }
  }
}
