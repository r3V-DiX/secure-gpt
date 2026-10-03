import type { PIIConfig } from './config.types'
import type { DetectionResult, PIIEntity } from './detection.types'

export const DOCUMENT_PROCESSING_MS = 120_000
export type DocumentPhase = 'queued' | 'checking' | 'awaiting-warning' | 'redacting' | 'attaching' | 'completed' | 'failed' | 'cancelled'
export type DocumentKind = 'image' | 'pdf' | 'office'
export type DocumentEntity = PIIEntity & { page?: number | undefined }
export type DocumentScan = Omit<DetectionResult, 'entities'> & { entities: DocumentEntity[] }
export type DocumentReply<T> = { ok: true; value: T } | { ok: false; code: string }

export interface DocumentRequest {
  type: 'DOCUMENT_SCAN' | 'DOCUMENT_REDACT' | 'DOCUMENT_CANCEL'
  jobId: string
  policyVersion: PIIConfig['version']
  config?: PIIConfig
  dataUrl?: string
  fileName?: string
  kind?: DocumentKind
}

export interface DocumentProgress {
  type: 'DOCUMENT_PROGRESS'
  jobId: string
  policyVersion: PIIConfig['version']
  phase: 'checking' | 'redacting'
  page?: number | undefined
  pages?: number | undefined
  sensitive?: boolean | undefined
}

/** One resolver for every finding, including rule-level policy overrides. */
export function documentAction(entity: PIIEntity, policy: PIIConfig) {
  const category = policy.categories[entity.category]
  if (!category?.enabled) return 'ALLOW'
  if (category.ruleOverrides?.[entity.ruleId]?.enabled === false) return 'ALLOW'
  return category.ruleOverrides?.[entity.ruleId]?.action ?? category.action ?? 'ALLOW'
}

export function documentMasks(entities: PIIEntity[], policy: PIIConfig): PIIEntity[] {
  return entities.filter(entity => ['BLOCK', 'MASK'].includes(documentAction(entity, policy)))
}

export function remainingDocumentWarnings(entities: DocumentEntity[], masks: DocumentEntity[], policy: PIIConfig): DocumentEntity[] {
  return entities.filter(entity => documentAction(entity, policy) === 'WARN_ALLOW' && !masks.some(mask => {
    if (mask.page !== entity.page) return false
    if (entity.bboxes?.length) return entity.bboxes.every(box => mask.bboxes?.some(region =>
      region.x0 <= box.x0 && region.y0 <= box.y0 && region.x1 >= box.x1 && region.y1 >= box.y1))
    return mask.startIndex <= entity.startIndex && mask.endIndex >= entity.endIndex
  }))
}
