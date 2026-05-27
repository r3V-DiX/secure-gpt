// ─────────────────────────────────────────────
// Log Batcher
// Batches audit events and sends to backend every LOG_BATCH_INTERVAL_MS.
// Uses chrome.alarms instead of setInterval so the flush fires reliably
// even after the MV3 service worker is suspended.
// ─────────────────────────────────────────────

import { authStorage, localStorageExt } from '@/lib/storage/storage'
import { API_ENDPOINTS, LOG_BATCH_MAX_SIZE } from '@/config/api.config'
import apiClient from '@/lib/api/client'
import type { AuditLog } from '@securegpt/shared/types'

const QUEUE_KEY = 'log_queue'
const FLUSH_ALARM_NAME = 'securegpt-log-flush'
// Chrome minimum is 1 minute
const FLUSH_ALARM_PERIOD_MIN = 1

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
  chrome.alarms.onAlarm.addListener(handleAlarm)
  chrome.alarms.get(FLUSH_ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(FLUSH_ALARM_NAME, {
        periodInMinutes: FLUSH_ALARM_PERIOD_MIN,
      })
    }
  })
}

export function handleLogAlarm(alarmName: string): void {
  if (alarmName === FLUSH_ALARM_NAME) {
    void flushLogs()
  }
}

function handleAlarm(alarm: chrome.alarms.Alarm): void {
  handleLogAlarm(alarm.name)
}

// Called from onSuspend — schedules a one-shot alarm so the SW wakes ASAP
// after suspension and drains any queued logs that couldn't be sent in time.
export function scheduleRecoveryFlush(): void {
  chrome.alarms.create('securegpt-log-recovery', { delayInMinutes: 1 })
}

export async function queueLog(event: AuditLog): Promise<void> {
  return enqueue(async () => {
    const queue = await getQueue()
    queue.push(event)
    await _flush(queue)
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
    return
  }

  const isLoggedIn = await authStorage.isLoggedIn()
  if (!isLoggedIn) {
    console.warn('[SecureGPT] Not logged in, skipping log flush')
    return
  }

  const batch = queue.splice(0, LOG_BATCH_MAX_SIZE)
  console.log(`[SecureGPT] Flushing ${batch.length} logs...`)

  try {
    await apiClient.post(
      API_ENDPOINTS.EXTENSION_LOG,
      { events: batch },
      { timeout: 10000 }
    )
    await saveQueue(queue)
    console.log(`[SecureGPT] Successfully flushed ${batch.length} log events`)
  } catch (err: any) {
    // Backend unreachable or session expired — put batch back so nothing is lost
    const remaining = [...batch, ...queue]
    await saveQueue(remaining)
    console.error('[SecureGPT] Log flush failed:', err.message)
  }
}

async function getQueue(): Promise<AuditLog[]> {
  return (await localStorageExt.get<AuditLog[]>(QUEUE_KEY)) ?? []
}

async function saveQueue(queue: AuditLog[]): Promise<void> {
  await localStorageExt.set(QUEUE_KEY, queue)
}
