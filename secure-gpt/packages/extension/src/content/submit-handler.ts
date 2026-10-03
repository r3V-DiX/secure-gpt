// packages/extension/src/content/submit-handler.ts
import { showBanner, removeBanner } from './banners'
import { showShieldModal } from './modal-manager'
import { logDetectionEvent } from './audit-logger'
import { applyMasking } from '@/features/actions/services/masking.service'
import { setInputValue, resubmit } from './text-replacer'
import { waitForPendingOcr } from './ocr-wait-handler'
import { clearAttachments, dispatchFilePaste, dispatchImagePaste, extractText } from './dom-utils'
import type { PIIConfig, DetectionResult, PIIEntity } from '@securegpt/shared/types'
import { POLICY_ACTION_PRIORITY, type PolicyAction, type LLMPlatform } from '@securegpt/shared/constants'

export function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id
  } catch {
    return false
  }
}

export function getMostRestrictiveAction(
  entities: PIIEntity[],
  policy: PIIConfig
): { action: PolicyAction; topEntity: PIIEntity } {
  let maxPriority = -1
  let topAction: PolicyAction = 'ALLOW'
  let topEntity = entities[0]!

  for (const entity of entities) {
    const catConfig = policy.categories[entity.category]
    const ruleAction = catConfig?.ruleOverrides?.[entity.ruleId]?.action as PolicyAction | undefined
    const action: PolicyAction = (ruleAction ?? catConfig?.action ?? 'ALLOW') as PolicyAction
    const priority = POLICY_ACTION_PRIORITY[action] ?? 0
    if (priority > maxPriority) {
      maxPriority = priority
      topAction = action
      topEntity = entity
    }
  }

  return { action: topAction, topEntity }
}

export interface SubmitContext {
  getCurrentPolicy: () => PIIConfig
  getPreAllowedText: () => string
  ocrCache: Map<string, PIIEntity[]>
  getPendingCount: () => number
  isProtectionActive?: () => boolean
  resubmit?: (el: HTMLElement) => void
  entryPlatform?: LLMPlatform
}

let isRunning = false

export async function handleSubmit(
  el: HTMLElement,
  ctx: SubmitContext
): Promise<void> {
  if (!isExtensionContextValid()) {
    console.warn('[SecureGPT] Extension context invalidated — refresh the page to re-enable protection')
    return
  }

  if (isRunning) return
  isRunning = true

  const currentPolicy = ctx.getCurrentPolicy()
  const preAllowedText = ctx.getPreAllowedText()
  const ocrCache = ctx.ocrCache
  const submit = ctx.resubmit ?? resubmit

  try {
    const isActive = await new Promise<boolean>((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(true)
        } else {
          resolve(res?.active ?? true)
        }
      })
    })

    if (!isActive || ctx.isProtectionActive?.() === false) {
      isRunning = false
      submit(el)
      return
    }

    // Wait for in-flight image/PDF OCR to complete (with timeout)
    if (ctx.getPendingCount() > 0) {
      await waitForPendingOcr(ctx.getPendingCount)
    }
    if (ctx.isProtectionActive?.() === false) {
      isRunning = false
      submit(el)
      return
    }

    const text = extractText(el)

    if (text === preAllowedText && text.trim().length > 0) {
      console.log('[SecureGPT] Bypassing submit detection because text was pre-allowed via live tooltip.')
      isRunning = false
      submit(el)
      return
    }

    const hasCachedImages = ocrCache.size > 0
    if ((!text || text.trim().length === 0) && !hasCachedImages) {
      isRunning = false
      submit(el)
      return
    }

    console.log('[SecureGPT] Requesting detection from background...')
    const allOcrEntities = Array.from(ocrCache.values()).flat()

    let result: DetectionResult
    if (text.trim().length > 0) {
      result = await new Promise<DetectionResult>((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'DETECT_PII', text, config: currentPolicy, entryPlatform: ctx.entryPlatform },
          (res) => {
            if (chrome.runtime.lastError) {
              console.error('[SecureGPT] Background detection error:', chrome.runtime.lastError)
              resolve({ hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: text.length })
            } else {
              resolve(res)
            }
          }
        )
      })
    } else {
      result = { hasFindings: false, entities: [], tier: 'regex', processingTimeMs: 0, inputLength: 0 }
    }
    console.log('[SecureGPT] Detection result:', result)
    if (ctx.isProtectionActive?.() === false) {
      isRunning = false
      submit(el)
      return
    }

    const mergedEntities = [...result.entities, ...allOcrEntities]
    const hasFindings = result.hasFindings || allOcrEntities.length > 0

    if (!hasFindings) {
      ocrCache.clear()
      isRunning = false
      submit(el)
      return
    }

    const { action, topEntity } = getMostRestrictiveAction(mergedEntities, currentPolicy)
    console.log(`[SecureGPT] Primary Action: ${action} triggered by ${topEntity.category}`)

    if (action === 'BLOCK') {
      showBanner('block', topEntity.category, mergedEntities.length, undefined, () => {
        showShieldModal(
          { ...result, entities: mergedEntities, hasFindings },
          currentPolicy,
          text,
          undefined,
          true,
          'Blocked: PII/Confidentiality Leak Detected'
        )
      })
      void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'block' })
      void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'BLOCK', topEntity, false, ctx.entryPlatform)
      ocrCache.clear()
      isRunning = false
      return
    }

    if (action === 'ALLOW') {
      void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'ALLOW', topEntity, false, ctx.entryPlatform)
      isRunning = false
      submit(el)
      return
    }

    if (action === 'MASK') {
      console.log('[SecureGPT] Automatic masking triggered')
      const maskedText = applyMasking(text, result.entities)
      setInputValue(el, maskedText)
      ocrCache.clear()

      void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
      void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'MASK', topEntity, false, ctx.entryPlatform)
      showBanner('mask', topEntity.category, mergedEntities.length, undefined, () => {
        showShieldModal(
          { ...result, entities: mergedEntities, hasFindings },
          currentPolicy,
          text,
          undefined,
          true,
          'Masked: Sensitive Data Redacted'
        )
      })

      isRunning = false
      setTimeout(() => submit(el), 400)
      return
    }

    // WARN_ALLOW
    isRunning = false
    showShieldModal(
      { ...result, entities: mergedEntities, hasFindings },
      currentPolicy,
      text,
      async (proceed, masked, _acknowledged) => {
        removeBanner()

        if (!proceed) {
          console.log('[SecureGPT] User cancelled submission')
          return
        }

        if (masked) {
          const maskedText = applyMasking(text, result.entities)
          setInputValue(el, maskedText)

          await clearAttachments()
          for (const [fileUrl] of ocrCache.entries()) {
            const isPdf = fileUrl.startsWith('data:application/pdf')
            if (isPdf) {
              await dispatchFilePaste(el, fileUrl, 'redacted.pdf', 'application/pdf')
            } else {
              await dispatchImagePaste(el, fileUrl)
            }
          }
          ocrCache.clear()

          void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'mask' })
          void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'MASK', topEntity, false, ctx.entryPlatform)
          showBanner('mask', topEntity.category, mergedEntities.length, undefined, () => {
            showShieldModal(
              { ...result, entities: mergedEntities, hasFindings },
              currentPolicy,
              text,
              undefined,
              true,
              'Masked: Sensitive Data Redacted'
            )
          })

          setTimeout(() => submit(el), 400)
        } else {
          ocrCache.clear()
          void chrome.runtime.sendMessage({ type: 'INCREMENT_STAT', action: 'warn' })
          void logDetectionEvent({ ...result, entities: mergedEntities, hasFindings }, 'WARN_ALLOW', topEntity, true, ctx.entryPlatform)
          submit(el)
        }
      }
    )

  } catch (err) {
    const message = (err as Error)?.message ?? ''
    if (message.includes('Extension context invalidated')) {
      console.warn('[SecureGPT] Extension context lost mid-flight — refresh the page')
    } else {
      console.error('[SecureGPT] Error in handleSubmit:', err)
    }
    isRunning = false
    submit(el)
  }
}
