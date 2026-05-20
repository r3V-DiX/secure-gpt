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
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    /* ── Tailwind utility classes used by ShieldModal ── */
    .fixed { position: fixed; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .z-\\[9998\\] { z-index: 9998; }
    .z-\\[9999\\] { z-index: 9999; }
    .bg-black\\/40 { background-color: rgba(0,0,0,0.45); }
    .backdrop-blur-sm { backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-1 { flex: 1 1 0%; }
    .flex-shrink-0 { flex-shrink: 0; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-center { justify-content: center; }
    .min-w-0 { min-width: 0; }
    .p-4 { padding: 1rem; }

    /* ── Category color classes ── */
    .bg-red-50    { background-color: #fef2f2; }
    .bg-amber-50  { background-color: #fffbeb; }
    .bg-purple-50 { background-color: #faf5ff; }
    .bg-blue-50   { background-color: #eff6ff; }
    .border-red-200    { border-color: #fecaca; }
    .border-amber-200  { border-color: #fde68a; }
    .border-purple-200 { border-color: #e9d5ff; }
    .border-blue-200   { border-color: #bfdbfe; }
    .text-red-700    { color: #b91c1c; }
    .text-amber-700  { color: #b45309; }
    .text-purple-700 { color: #7e22ce; }
    .text-blue-700   { color: #1d4ed8; }
    .bg-red-400    { background-color: #f87171; }
    .bg-amber-400  { background-color: #fbbf24; }
    .bg-purple-400 { background-color: #c084fc; }
    .bg-blue-400   { background-color: #60a5fa; }

    /* ── Modal card ── */
    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.06);
      width: 100%;
      max-width: 420px;
      max-height: 82vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* ── Header ── */
    .modal-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 18px 18px 14px;
      border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0;
    }
    .shield-icon-wrap {
      width: 38px; height: 38px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px;
      flex-shrink: 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .modal-title {
      font-size: 14px;
      font-weight: 650;
      color: #0f172a;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .modal-subtitle {
      font-size: 11.5px;
      color: #94a3b8;
      margin-top: 2px;
      line-height: 1.4;
    }
    .close-btn {
      background: transparent !important;
      border: none !important;
      cursor: pointer;
      color: #94a3b8;
      font-size: 16px;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
      flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { color: #475569; background: #f1f5f9 !important; }

    /* ── Body ── */
    .modal-body {
      flex: 1;
      overflow-y: auto;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .modal-body::-webkit-scrollbar { width: 4px; }
    .modal-body::-webkit-scrollbar-track { background: transparent; }
    .modal-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

    /* ── Category card ── */
    .category-card {
      border-radius: 10px;
      border-width: 1px;
      border-style: solid;
      padding: 10px 12px;
    }
    .category-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .category-icon { font-size: 13px; line-height: 1; }
    .category-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex: 1;
    }
    .category-count {
      font-size: 10px;
      font-weight: 600;
      opacity: 0.7;
    }

    /* ── Entity rows ── */
    .entity-list { display: flex; flex-direction: column; gap: 5px; }
    .entity-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.75);
      border-radius: 7px;
      padding: 6px 10px;
    }
    .entity-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .entity-type {
      font-size: 11px;
      color: #64748b;
      flex-shrink: 0;
      text-transform: capitalize;
      min-width: 80px;
    }
    .entity-value {
      font-size: 11px;
      font-family: ui-monospace, 'SF Mono', Consolas, monospace;
      color: #1e293b;
      background: rgba(0,0,0,0.05);
      padding: 2px 6px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 160px;
    }

    /* ── Masking preview ── */
    .preview-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .preview-label {
      font-size: 10.5px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .preview-text {
      font-size: 12px;
      font-family: ui-monospace, 'SF Mono', Consolas, monospace;
      color: #475569;
      line-height: 1.6;
      max-height: 90px;
      overflow-y: auto;
      word-break: break-word;
    }
    .masked-token {
      background: #fde68a;
      color: #78350f;
      padding: 1px 4px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* ── Footer ── */
    .modal-footer {
      padding: 12px 18px 14px;
      border-top: 1px solid #f1f5f9;
      flex-shrink: 0;
    }
    .footer-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer-note {
      font-size: 10.5px;
      color: #cbd5e1;
      text-align: center;
      margin-top: 10px;
    }

    /* ── Buttons ── */
    button {
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 8px;
      padding: 0 14px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.15s ease;
      white-space: nowrap;
      letter-spacing: -0.01em;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-primary {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #fff;
      border: none;
      box-shadow: 0 1px 3px rgba(37,99,235,0.4), 0 0 0 0 rgba(37,99,235,0);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      box-shadow: 0 2px 8px rgba(37,99,235,0.45);
      transform: translateY(-0.5px);
    }
    .btn-secondary {
      background: #ffffff;
      color: #374151;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-secondary:hover { background: #f9fafb; border-color: #d1d5db; }
    .btn-ghost {
      background: transparent;
      color: #6b7280;
      border: none;
    }
    .btn-ghost:hover { background: #f3f4f6; color: #374151; }
    .btn-full { flex: 1; }

    /* ── Animation ── */
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }

    /* ── Residual Tailwind utilities (backdrop, positioning) ── */
    .animate-slide-up { animation: slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
  `
}