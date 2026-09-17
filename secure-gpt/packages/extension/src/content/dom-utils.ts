// packages/extension/src/content/dom-utils.ts
// DOM element discovery, selector resolution, and text extraction

import { INPUT_SELECTORS } from './platform-selectors.constants'
export * from './platform-selectors.constants'
export * from './dom-dispatcher'

export const BUTTON_SELECTORS = [
  'button[data-testid$="send-button"]',
  'button[aria-label*="Send"]',
  'button[aria-label*="Submit"]',
  'button[aria-label*="Ask"]',
  'button[aria-label*="Search"]',
  'button[data-testid*="send"]',
  'button[data-testid*="submit"]',
  'button[data-testid*="ask"]',
  'button[data-testid*="composer-button"]',
  'button[aria-label*="Generate"]',
  'button[data-testid="send-button"]',
  'button:has(svg path[d*="M13.22"])',
  'button.bg-accentMain',
  'div[role="button"][aria-label*="Send"]',
]

/**
 * Specifically look for the send/submit button.
 */
export function findSendButton(): HTMLButtonElement | null {
  for (const selector of BUTTON_SELECTORS) {
    const btn = document.querySelector<HTMLButtonElement>(selector)
    if (btn && isVisible(btn)) return btn
  }
  return null
}

/**
 * From a target (which may be an inner element in contenteditable),
 * walk up to find the actual contenteditable/textarea root.
 */
export function findEditableRoot(target: EventTarget | null): HTMLElement | null {
  if (!target || !(target instanceof Element)) return null

  if (target.tagName === 'TEXTAREA') return target as HTMLElement

  const ce = target.closest<HTMLElement>(
    '[contenteditable="true"],[contenteditable="plaintext-only"],[contenteditable=""],[role="textbox"],[role="combobox"]'
  )
  if (ce) return ce

  return null
}

/**
 * Look for the main chat input editor on LLM sites using known selectors.
 * Fallback for when we don't have an event target.
 */
export function findMainEditor(): HTMLElement | null {
  // 1. Try focused element first
  const active = document.activeElement
  const root = findEditableRoot(active)
  if (root && isVisible(root)) return root

  // 2. Try known selectors
  for (const selector of INPUT_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el && isVisible(el)) return el
  }

  return null
}

export function extractText(el: HTMLElement): string {
  if (el.tagName === 'TEXTAREA') {
    return (el as HTMLTextAreaElement).value
  }

  // contenteditable div
  return (el.innerText ?? el.textContent ?? '').replace(/\n$/, '').trim()
}

export function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  const style = window.getComputedStyle(el)

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  )
}

// ── Banner injection helpers ──────────────────
export function getInputContainer(): HTMLElement | null {
  const input = findMainEditor()
  if (!input) return null
  return (
    input.closest('form') ??
    input.parentElement?.parentElement ??
    input.parentElement ??
    null
  )
}

export function injectBanner(banner: HTMLElement): void {
  const container = getInputContainer()
  console.log('[SecureGPT] Injecting banner. Container found:', !!container)
  if (!container) {
    console.log('[SecureGPT] No input container found, injecting into document.body (fixed position)')
    banner.style.position = 'fixed'
    banner.style.top = '20px'
    banner.style.left = '50%'
    banner.style.transform = 'translateX(-50%)'
    banner.style.width = 'auto'
    banner.style.maxWidth = '90%'
    document.body.appendChild(banner)
    return
  }
  container.insertAdjacentElement('beforebegin', banner)
}

export function removeAllBanners(): void {
  document.querySelectorAll('[data-securegpt-banner]').forEach((el) => el.remove())
}
