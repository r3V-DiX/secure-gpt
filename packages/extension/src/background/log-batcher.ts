// ─────────────────────────────────────────────
// Log Batcher
// Batches audit events and sends to backend
// Stores offline queue in local storage
// ─────────────────────────────────────────────

import axios from 'axios'
import { authStorage, localStorageExt } from '@/lib/storage/storage'
import {
  API_BASE_URL,
  API_ENDPOINTS,
  LOG_BATCH_INTERVAL_MS,
  LOG_BATCH_MAX_SIZE,
} from '@/config/api.config'
import type { AuditLog } from '@securegpt/shared/types'

const QUEUE_KEY = 'log_queue'
let batchIntervalId: ReturnType<typeof setInterval> | null = null

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

  const auth = await authStorage.getAuth()
  if (!auth) return // Not authenticated — keep in queue

  // Take up to LOG_BATCH_MAX_SIZE events
  const batch = queue.splice(0, LOG_BATCH_MAX_SIZE)

  try {
    await axios.post(
      `${API_BASE_URL}${API_ENDPOINTS.LOGS_BATCH}`,
      {
        device_token: auth.deviceToken,
        org_id: auth.user.orgId,
        events: batch,
      },
      { timeout: 10000 }
    )

    // Save remaining queue (events after the batch)
    await saveQueue(queue)
    console.log(`[SecureGPT] Flushed ${batch.length} log events`)
  } catch {
    // Backend unreachable — put batch back in queue
    const remaining = [...batch, ...queue]
    await saveQueue(remaining)
    console.warn('[SecureGPT] Log flush failed — queued for retry')
  }
}

async function getQueue(): Promise<AuditLog[]> {
  return (await localStorageExt.get<AuditLog[]>(QUEUE_KEY)) ?? []
}

async function saveQueue(queue: AuditLog[]): Promise<void> {
  await localStorageExt.set(QUEUE_KEY, queue)
}
