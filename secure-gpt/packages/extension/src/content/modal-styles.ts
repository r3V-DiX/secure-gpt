// packages/extension/src/content/modal-styles.ts
// Unified Dark & Light theme tokens and component styles for ShieldModal

import { MODAL_THEME_TOKENS } from "./modal-theme-tokens";

export function getModalStyles(): string {
  return `
    ${MODAL_THEME_TOKENS}

    /* ── Tailwind utility classes used by ShieldModal ── */
    .fixed { position: fixed; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .z-\\[9998\\] { z-index: 9998; }
    .z-\\[9999\\] { z-index: 9999; }
    .bg-black\\/40 { background-color: rgba(0,0,0,0.55); }
    .backdrop-blur-sm { backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
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
    .bg-red-50    { background-color: var(--cat-red-bg); }
    .bg-amber-50  { background-color: var(--cat-amber-bg); }
    .bg-purple-50 { background-color: var(--cat-purple-bg); }
    .bg-blue-50   { background-color: var(--cat-blue-bg); }
    .border-red-200    { border-color: var(--cat-red-border); }
    .border-amber-200  { border-color: var(--cat-amber-border); }
    .border-purple-200 { border-color: var(--cat-purple-border); }
    .border-blue-200   { border-color: var(--cat-blue-border); }
    .text-red-700    { color: var(--cat-red-text); }
    .text-amber-700  { color: var(--cat-amber-text); }
    .text-purple-700 { color: var(--cat-purple-text); }
    .text-blue-700   { color: var(--cat-blue-text); }
    .bg-red-400    { background-color: var(--cat-red-dot); }
    .bg-amber-400  { background-color: var(--cat-amber-dot); }
    .bg-purple-400 { background-color: var(--cat-purple-dot); }
    .bg-blue-400   { background-color: var(--cat-blue-dot); }

    /* ── Modal card ── */
    .modal-card {
      background: var(--bg-surface);
      border-radius: 12px;
      box-shadow: var(--shadow-modal);
      border: 1px solid var(--border);
      width: 100%;
      max-width: 440px;
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
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .shield-icon-wrap {
      width: 38px; height: 38px;
      background: var(--accent-light);
      border: 1px solid var(--accent-border);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px;
      flex-shrink: 0;
      color: var(--accent-text);
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .modal-title {
      font-size: 14px;
      font-weight: 650;
      color: var(--text-primary);
      line-height: 1.3;
      letter-spacing: -0.01em;
    }
    .modal-subtitle {
      font-size: 11.5px;
      color: var(--text-tertiary);
      margin-top: 2px;
      line-height: 1.4;
    }
    .close-btn {
      background: transparent !important;
      border: none !important;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 16px;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
      flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .close-btn:hover { color: var(--text-primary); background: var(--bg-surface-2) !important; }

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
    .modal-body::-webkit-scrollbar-thumb { background: var(--bg-surface-3); border-radius: 4px; }

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
      opacity: 0.8;
    }

    /* ── Entity rows ── */
    .entity-list { display: flex; flex-direction: column; gap: 5px; }
    .entity-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--entity-row-bg);
      border-radius: 7px;
      padding: 6px 10px;
      border: 1px solid var(--border);
    }
    .entity-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .entity-type {
      font-size: 11px;
      color: var(--text-secondary);
      flex-shrink: 0;
      text-transform: capitalize;
      min-width: 80px;
    }
    .entity-value {
      font-size: 11px;
      font-family: ui-monospace, 'SF Mono', Consolas, monospace;
      color: var(--entity-code-text);
      background: var(--entity-code-bg);
      padding: 2px 6px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 170px;
    }

    /* ── Masking preview ── */
    .preview-card {
      background: var(--bg-surface-2);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .preview-label {
      font-size: 10.5px;
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .preview-text {
      font-size: 12px;
      font-family: ui-monospace, 'SF Mono', Consolas, monospace;
      color: var(--text-secondary);
      line-height: 1.6;
      max-height: 90px;
      overflow-y: auto;
      word-break: break-word;
    }
    .masked-token {
      background: var(--cat-amber-bg);
      color: var(--cat-amber-text);
      border: 1px solid var(--cat-amber-border);
      padding: 1px 4px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* ── Footer ── */
    .modal-footer {
      padding: 12px 18px 14px;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
      background: var(--bg-surface);
    }
    .footer-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer-note {
      font-size: 10.5px;
      color: var(--text-muted);
      text-align: center;
      margin-top: 10px;
    }

    /* ── Buttons ── */
    button {
      cursor: pointer;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      padding: 0 12px;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.12s ease;
      white-space: nowrap;
      letter-spacing: -0.01em;
      outline: none;
    }
    button:focus-visible {
      box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 4px var(--accent);
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-primary {
      background: var(--accent);
      color: #fff;
      border: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-0.5px);
    }
    .btn-secondary {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-strong);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-secondary:hover { background: var(--bg-surface-2); border-color: var(--border-strong); }
    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border: none;
    }
    .btn-ghost:hover { background: var(--bg-surface-2); color: var(--text-primary); }
    .btn-full { flex: 1; }

    /* ── Animation ── */
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }

    .animate-slide-up { animation: slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
  `;
}
