// ─────────────────────────────────────────────
// Log Batcher
// Batches audit events and sends to backend every LOG_BATCH_INTERVAL_MS.
// Uses session cookie auth — no device_token needed.
// ─────────────────────────────────────────────

import { authStorage, localStorageExt } from '@/lib/storage/storage'
import { API_ENDPOINTS, LOG_BATCH_INTERVAL_MS, LOG_BATCH_MAX_SIZE } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import type { AuditLog } from '@securegpt/shared/types'

const QUEUE_KEY = 'log_queue'

// Bug 13 fix: serialize all queue mutations through a single promise chain.
// Without this, concurrent queueLog + flushLogs calls both read a snapshot,
// modify it independently, and the last writer silently drops the other's changes.
let queueChain: Promise<void> = Promise.resolve()

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = queueChain.then(fn)
  // Keep the chain alive even if fn rejects so future operations aren't blocked
  queueChain = next.then(() => undefined, () => undefined)
  return next
}

export function startLogBatcher(): void {
  setInterval(() => {
    void flushLogs()
  }, LOG_BATCH_INTERVAL_MS)
}

export async function queueLog(event: AuditLog): Promise<void> {
  return enqueue(async () => {
    const queue = await getQueue()
    queue.push(event)

    if (queue.length >= LOG_BATCH_MAX_SIZE) {
      await _flush(queue)
    } else {
      await saveQueue(queue)
    }
  })
}

export async function flushLogs(): Promise<void> {
  return enqueue(async () => {
    const queue = await getQueue()
    await _flush(queue)
  })
}

// Internal flush — always called inside the serialized chain so the queue
// state is consistent. Never call this directly from outside.
async function _flush(queue: AuditLog[]): Promise<void> {
  if (queue.length === 0) {
    console.log('[SecureGPT] Log queue is empty, skipping flush')
    return
  }

  const isLoggedIn = await authStorage.isLoggedIn()
  if (!isLoggedIn) {
    console.warn('[SecureGPT] Not logged in, skipping log flush')
    return
  }

  const batch = queue.splice(0, LOG_BATCH_MAX_SIZE)
  console.log(`[SecureGPT] Flushing ${batch.length} logs to ${API_ENDPOINTS.EXTENSION_LOG}...`)

  try {
    const response = await apiClient.post(
      API_ENDPOINTS.EXTENSION_LOG,
      { events: batch },
      { timeout: 10000 }
    )
    console.log('[SecureGPT] Log flush success:', response.data)
    await saveQueue(queue)
    console.log(`[SecureGPT] Successfully flushed ${batch.length} log events`)
  } catch (err: any) {
    // Backend unreachable or session expired — put batch back so nothing is lost
    const remaining = [...batch, ...queue]
    await saveQueue(remaining)
    console.error('[SecureGPT] Log flush failed:', err.message, err.response?.data)
  }
}

async function getQueue(): Promise<AuditLog[]> {
  return (await localStorageExt.get<AuditLog[]>(QUEUE_KEY)) ?? []
}

async function saveQueue(queue: AuditLog[]): Promise<void> {
  await localStorageExt.set(QUEUE_KEY, queue)
}
