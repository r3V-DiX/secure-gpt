// ─────────────────────────────────────────────
// Log Batcher
// Batches audit events and sends to backend
// Uses session cookie auth — no device_token needed
// ─────────────────────────────────────────────

import { authStorage, localStorageExt } from '@/lib/storage/storage'
import { API_ENDPOINTS, LOG_BATCH_INTERVAL_MS, LOG_BATCH_MAX_SIZE } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import type { AuditLog } from '@securegpt/shared/types'

const QUEUE_KEY = 'log_queue'

export function startLogBatcher(): void {
  setInterval(() => {
    void flushLogs()
  }, LOG_BATCH_INTERVAL_MS)
}

export async function queueLog(event: AuditLog): Promise<void> {
  const queue = await getQueue()
  queue.push(event)

  // Auto-flush if queue hits max size
  if (queue.length >= LOG_BATCH_MAX_SIZE) {
    await flushLogs()
  } else {
    await saveQueue(queue)
  }
}

export async function flushLogs(): Promise<void> {
  const queue = await getQueue()
  if (queue.length === 0) return

  // Check we have a cached user — if not, session likely expired
  const isLoggedIn = await authStorage.isLoggedIn()
  if (!isLoggedIn) return // keep in queue until re-auth

  const batch = queue.splice(0, LOG_BATCH_MAX_SIZE)

  try {
    // apiClient has withCredentials: true and X-Extension-Request: true already set
    // Backend reads user_id from session — we just send events
    await apiClient.post(
      API_ENDPOINTS.EXTENSION_LOG,
      { events: batch },
      { timeout: 10000 }
    )

    // Save remaining queue
    await saveQueue(queue)
    console.log(`[SecureGPT] Flushed ${batch.length} log events`)

  } catch (err) {
    // Backend unreachable or session expired — put batch back
    const remaining = [...batch, ...queue]
    await saveQueue(remaining)
    console.warn('[SecureGPT] Log flush failed — queued for retry:', err)
  }
}

async function getQueue(): Promise<AuditLog[]> {
  return (await localStorageExt.get<AuditLog[]>(QUEUE_KEY)) ?? []
}

async function saveQueue(queue: AuditLog[]): Promise<void> {
  await localStorageExt.set(QUEUE_KEY, queue)
}