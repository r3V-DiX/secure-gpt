// ─────────────────────────────────────────────
// Modal Manager
// Injects and manages the ShieldModal in LLM pages
// Uses a Shadow DOM to isolate styles from the host page
// ─────────────────────────────────────────────

import { createRoot, type Root } from 'react-dom/client'
import { ShieldModal } from '@/features/shield-modal/components/ShieldModal'
import type { DetectionResult, PIIConfig } from '@securegpt/shared/types'
import { getModalStyles } from './modal-styles'

let modalRoot: Root | null = null
let shadowHost: HTMLElement | null = null

// onDecision(proceed, masked, acknowledged)
//   proceed:      true = user wants to send (either masked or directly)
//   masked:       true = mask & send, false = send directly
//   acknowledged: true = user explicitly acknowledged the risk
export function showShieldModal(
  result: DetectionResult,
  config: PIIConfig,
  originalText: string,
  onDecision?: (proceed: boolean, masked: boolean, acknowledged: boolean) => void,
  readOnly = false,
  readOnlyTitle?: string
): void {
  // Remove any existing modal first
  removeShieldModal()

  // Shadow host — isolates modal CSS from the LLM page's styles
  shadowHost = document.createElement('div')
  shadowHost.setAttribute('data-securegpt', 'true')
  shadowHost.setAttribute('data-securegpt-modal', 'true')
  shadowHost.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;'
  document.body.appendChild(shadowHost)

  const shadow = shadowHost.attachShadow({ mode: 'open' })

  // Inject base styles into shadow DOM
  const styleEl = document.createElement('style')
  styleEl.textContent = getModalStyles()
  shadow.appendChild(styleEl)

  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  modalRoot = createRoot(mountPoint)
  modalRoot.render(
    <ShieldModal
      result={result}
      config={config}
      originalText={originalText}
      readOnly={readOnly}
      readOnlyTitle={readOnlyTitle}
      onProceed={(acknowledged) => {
        onDecision?.(true, false, acknowledged)
        removeShieldModal()
      }}
      onCancel={() => {
        onDecision?.(false, false, false)
        removeShieldModal()
      }}
      onMask={() => {
        onDecision?.(true, true, false)
        removeShieldModal()
      }}
    />
  )
}

export function removeShieldModal(): void {
  if (modalRoot) {
    modalRoot.unmount()
    modalRoot = null
  }
  if (shadowHost) {
    shadowHost.remove()
    shadowHost = null
  }
}