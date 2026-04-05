// ─────────────────────────────────────────────
// Modal Manager
// Injects and manages the ShieldModal in LLM pages
// Uses a Shadow DOM to isolate styles from the host page
// ─────────────────────────────────────────────

import { createRoot, type Root } from 'react-dom/client'
import { ShieldModal } from '@/features/shield-modal/components/ShieldModal'
import type { DetectionResult } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'

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
  onDecision: (proceed: boolean, masked: boolean, acknowledged: boolean) => void
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
      onProceed={(acknowledged) => {
        // "Send Directly" — proceed=true, masked=false
        onDecision(true, false, acknowledged)
        removeShieldModal()
      }}
      onCancel={() => {
        // "Cancel" — proceed=false
        onDecision(false, false, false)
        removeShieldModal()
      }}
      onMask={() => {
        // "Mask & Send" — proceed=true, masked=true
        onDecision(true, true, false)
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

function getModalStyles(): string {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; }
    .fixed { position: fixed; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .z-\\[9998\\] { z-index: 9998; }
    .z-\\[9999\\] { z-index: 9999; }
    .bg-black\\/40 { background-color: rgba(0,0,0,0.4); }
    .backdrop-blur-sm { backdrop-filter: blur(4px); }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-1 { flex: 1 1 0%; }
    .flex-shrink-0 { flex-shrink: 0; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .w-full { width: 100%; }
    .max-w-lg { max-width: 32rem; }
    .max-h-\\[85vh\\] { max-height: 85vh; }
    .h-7 { height: 1.75rem; }
    .w-7 { width: 1.75rem; }
    .h-9 { height: 2.25rem; }
    .w-9 { width: 2.25rem; }
    .p-4 { padding: 1rem; }
    .p-3 { padding: 0.75rem; }
    .p-6 { padding: 1.5rem; }
    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
    .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
    .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-2 { margin-top: 0.5rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .space-y-2 > * + * { margin-top: 0.5rem; }
    .space-y-1\\.5 > * + * { margin-top: 0.375rem; }
    .overflow-y-auto { overflow-y: auto; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-mono { font-family: ui-monospace, monospace; }
    .uppercase { text-transform: uppercase; }
    .tracking-wide { letter-spacing: 0.025em; }
    .leading-relaxed { line-height: 1.625; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .min-w-0 { min-width: 0; }
    .bg-white { background-color: #fff; }
    .bg-white\\/60 { background-color: rgba(255,255,255,0.6); }
    .bg-gray-50 { background-color: #f9fafb; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .bg-amber-100 { background-color: #fef3c7; }
    .bg-amber-200 { background-color: #fde68a; }
    .bg-blue-50 { background-color: #eff6ff; }
    .bg-red-50 { background-color: #fef2f2; }
    .bg-amber-50 { background-color: #fffbeb; }
    .bg-purple-50 { background-color: #faf5ff; }
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-700 { color: #374151; }
    .text-gray-900 { color: #111827; }
    .text-amber-600 { color: #d97706; }
    .text-amber-900 { color: #78350f; }
    .text-blue-700 { color: #1d4ed8; }
    .text-red-700 { color: #b91c1c; }
    .text-amber-700 { color: #b45309; }
    .text-purple-700 { color: #7e22ce; }
    .border { border-width: 1px; }
    .border-t { border-top-width: 1px; }
    .border-b { border-bottom-width: 1px; }
    .border-gray-100 { border-color: #f3f4f6; }
    .border-gray-200 { border-color: #e5e7eb; }
    .border-blue-100 { border-color: #dbeafe; }
    .border-red-200 { border-color: #fecaca; }
    .border-amber-200 { border-color: #fde68a; }
    .border-purple-200 { border-color: #e9d5ff; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-2xl { border-radius: 1rem; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded { border-radius: 0.25rem; }
    .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0,0,0,.25); }

    /* Button base styles */
    button {
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.5rem;
      padding: 0.375rem 0.875rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      transition: opacity 0.15s, background 0.15s;
      white-space: nowrap;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Button variants */
    .btn-primary { background: #2563eb; color: #fff; border: none; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #fff; color: #374151; border: 1px solid #e5e7eb; }
    .btn-secondary:hover { background: #f9fafb; }
    .btn-ghost { background: transparent; color: #4b5563; border: none; }
    .btn-ghost:hover { background: #f3f4f6; }
    .btn-danger { background: #dc2626; color: #fff; border: none; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-full { width: 100%; }

    /* Badge */
    .badge {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.125rem 0.5rem; border-radius: 9999px;
      font-size: 0.75rem; font-weight: 500;
    }
    .badge-neutral { background: #f3f4f6; color: #6b7280; }
    .badge-danger { background: #fef2f2; color: #b91c1c; }
    .badge-warning { background: #fffbeb; color: #b45309; }
    .badge-info { background: #eff6ff; color: #1d4ed8; }

    @keyframes slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-up { animation: slide-up 0.25s ease-out; }
  `
}