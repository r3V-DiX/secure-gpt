import type { DocumentRequest, DocumentReply, DocumentScan, DocumentProgress, PIIConfig } from '@securegpt/shared/types'
import { documentMasks } from '@securegpt/shared/types'
import { DocumentScheduler, type DocumentBudget } from './document-scheduler'
import { ensureOffscreenReady } from './offscreen-proxy'
import { handleRedactOffice } from './redaction-handler'
import { authStorage, policyStorage, stateStorage } from '@/lib/storage/storage'
import { DEFAULT_EXTENSION_CONFIG } from '@/config/defaults.config'
import { getPlatformForUrl, isPlatformEnabled } from '../content/platform-routing'

interface Job {
  key: string
  request: DocumentRequest
  policy: PIIConfig
  budget: DocumentBudget
  sender: chrome.runtime.MessageSender
  scan?: DocumentScan
}
const scheduler = new DocumentScheduler()
const jobs = new Map<string, Job>()
const cancelled = new Set<string>()

async function currentPolicy(sender: chrome.runtime.MessageSender): Promise<PIIConfig> {
  const [policy, active, loggedIn] = await Promise.all([
    policyStorage.getPolicy(), stateStorage.isActive(), authStorage.isLoggedIn(),
  ])
  const config = policy ?? DEFAULT_EXTENSION_CONFIG
  if (!sender.tab?.id || !sender.url || getPlatformForUrl(sender.url) !== 'chatgpt' || !active || !loggedIn ||
      config.enableDocumentScanning === false || !isPlatformEnabled(config, 'chatgpt')) throw new Error('DOCUMENT_PROTECTION_CHANGED')
  return config
}

function rememberCancellation(key: string): void {
  cancelled.add(key)
  setTimeout(() => cancelled.delete(key), 300_000)
}

function release(job: Job): void {
  job.budget.controller.abort('DOCUMENT_CANCELLED')
  jobs.delete(job.key)
  rememberCancellation(job.key)
  void chrome.runtime.sendMessage({ action: 'OFFSCREEN_DOCUMENT_CANCEL', key: job.key }).catch(() => undefined)
}

function progress(job: Job, phase: 'checking' | 'redacting', page?: number, pages?: number, sensitive?: boolean): void {
  if (job.budget.controller.signal.aborted) return
  const message: DocumentProgress = { type: 'DOCUMENT_PROGRESS', jobId: job.request.jobId, policyVersion: job.request.policyVersion, phase, page, pages, sensitive }
  void chrome.tabs.sendMessage(job.sender.tab!.id!, message, { frameId: job.sender.frameId ?? 0 }).catch(() => release(job))
}

export function forwardDocumentProgress(message: { key: string; page?: number; pages?: number; sensitive?: boolean }): void {
  const job = jobs.get(message.key)
  if (job) progress(job, 'checking', message.page, message.pages, message.sensitive)
}

export function cancelTabDocuments(tabId: number): void {
  for (const job of jobs.values()) if (job.sender.tab?.id === tabId) release(job)
}

export async function handleDocumentRequest(request: DocumentRequest, sender: chrome.runtime.MessageSender): Promise<DocumentReply<DocumentScan | string | null>> {
  const key = `${sender.tab?.id}:${sender.documentId ?? sender.frameId}:${request.jobId}`
  let job = jobs.get(key)
  if (request.type === 'DOCUMENT_CANCEL') {
    rememberCancellation(key)
    if (job) release(job)
    return { ok: true, value: null }
  }
  try {
    const policy = await currentPolicy(sender)
    if (cancelled.has(key)) throw new Error('DOCUMENT_CANCELLED')
    if (policy.version !== request.policyVersion) throw new Error('DOCUMENT_POLICY_CHANGED')
    if (request.type === 'DOCUMENT_SCAN') {
      if (job) throw new Error('DOCUMENT_DUPLICATE_JOB')
      if (!request.dataUrl || !request.fileName || !request.kind) throw new Error('DOCUMENT_INVALID_REQUEST')
      job = { key, request, policy, budget: scheduler.createBudget(), sender }
      jobs.set(key, job)
      job.budget.controller.signal.addEventListener('abort', () => {
        void chrome.runtime.sendMessage({ action: 'OFFSCREEN_DOCUMENT_CANCEL', key }).catch(() => undefined)
      }, { once: true })
    }
    if (!job || JSON.stringify(policy) !== JSON.stringify(job.policy)) throw new Error('DOCUMENT_POLICY_CHANGED')
    const activeJob = job
    const value = await scheduler.run(job.budget, async () => {
      const heartbeat = setInterval(() => progress(activeJob, request.type === 'DOCUMENT_SCAN' ? 'checking' : 'redacting'), 20_000)
      try {
      if (JSON.stringify(await currentPolicy(sender)) !== JSON.stringify(policy)) throw new Error('DOCUMENT_POLICY_CHANGED')
      if (!await ensureOffscreenReady()) throw new Error('DOCUMENT_WORKER_UNAVAILABLE')
      activeJob.budget.controller.signal.throwIfAborted()
      if (request.type === 'DOCUMENT_SCAN') {
        progress(activeJob, 'checking')
        const response: DocumentReply<DocumentScan> = await chrome.runtime.sendMessage({
          action: 'OFFSCREEN_DOCUMENT_SCAN', key, request: activeJob.request, config: policy,
        })
        if (!response?.ok || !response.value || !Array.isArray(response.value.entities)) throw new Error(response?.ok === false ? response.code : 'DOCUMENT_INVALID_RESPONSE')
        activeJob.scan = response.value
        return response.value
      }
      if (!activeJob.scan) throw new Error('DOCUMENT_NOT_SCANNED')
      progress(activeJob, 'redacting')
      const entities = documentMasks(activeJob.scan.entities, policy)
      if (!entities.length) throw new Error('DOCUMENT_NOTHING_TO_REDACT')
      if (activeJob.request.kind === 'office') {
        const response = await handleRedactOffice(activeJob.request.dataUrl!, entities, activeJob.request.fileName, activeJob.budget.controller.signal)
        if (!response.ok || !response.redactedPdfData) throw new Error('DOCUMENT_OFFICE_REDACTION_FAILED')
        const verification: DocumentReply<null> = await chrome.runtime.sendMessage({
          action: 'OFFSCREEN_DOCUMENT_VERIFY_OFFICE', key, dataUrl: response.redactedPdfData, fileName: activeJob.request.fileName, entities,
        })
        if (!verification?.ok) throw new Error('DOCUMENT_OFFICE_VERIFICATION_FAILED')
        return response.redactedPdfData
      }
      const response: DocumentReply<string> = await chrome.runtime.sendMessage({ action: 'OFFSCREEN_DOCUMENT_REDACT', key, entities })
      if (!response?.ok || typeof response.value !== 'string') throw new Error(response?.ok === false ? response.code : 'DOCUMENT_INVALID_RESPONSE')
      return response.value
      } finally { clearInterval(heartbeat) }
    })
    job.budget.controller.signal.throwIfAborted()
    if (JSON.stringify(await currentPolicy(sender)) !== JSON.stringify(policy)) throw new Error('DOCUMENT_POLICY_CHANGED')
    return { ok: true, value }
  } catch (error) {
    const code = error instanceof Error && /^DOCUMENT_[A-Z_]+$/.test(error.message) ? error.message : 'DOCUMENT_PROCESSING_FAILED'
    if (job) release(job)
    console.warn('[SecureGPT document]', { jobId: request.jobId, status: 'failed', code })
    return { ok: false, code }
  }
}
