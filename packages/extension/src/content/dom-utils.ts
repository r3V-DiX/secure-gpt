// ─────────────────────────────────────────────
// DOM Utils
// Platform-specific input selectors
// ─────────────────────────────────────────────

// Each LLM platform uses different DOM structures
// These selectors target the main text input area

const INPUT_SELECTORS = [
  // ChatGPT
  '#prompt-textarea',
  'div[contenteditable="true"][data-id="root"]',
  // Gemini
  'div.ql-editor[contenteditable="true"]',
  'rich-textarea div[contenteditable="true"]',
  // Claude
  'div[contenteditable="true"].ProseMirror',
  // Copilot
  'textarea#searchbox',
  'div[contenteditable="true"]#searchbox',
  // Perplexity
  'textarea[placeholder*="Ask"]',
  // Meta AI
  'div[contenteditable="true"][role="textbox"]',
  // Generic fallback
  'textarea[placeholder]',
  'div[contenteditable="true"][role="textbox"]',
]

export function getInputElement(): HTMLElement | null {
  for (const selector of INPUT_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el && isVisible(el)) return el
  }
  return null
}

export function extractText(): string {
  const el = getInputElement()
  if (!el) return ''

  // contenteditable div
  if (el.getAttribute('contenteditable')) {
    return el.innerText ?? el.textContent ?? ''
  }

  // textarea
  if (el.tagName === 'TEXTAREA') {
    return (el as HTMLTextAreaElement).value
  }

  return el.textContent ?? ''
}

function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 &&
    window.getComputedStyle(el).visibility !== 'hidden' &&
    window.getComputedStyle(el).display !== 'none'
}

// ── Banner injection helpers ──────────────────
export function getInputContainer(): HTMLElement | null {
  const input = getInputElement()
  if (!input) return null
  // Walk up to find a suitable container
  return (
    input.closest('form') ??
    input.parentElement?.parentElement ??
    input.parentElement ??
    null
  )
}

export function injectBanner(banner: HTMLElement): void {
  const container = getInputContainer()
  if (!container) {
    document.body.appendChild(banner)
    return
  }
  container.insertAdjacentElement('beforebegin', banner)
}

export function removeAllBanners(): void {
  document.querySelectorAll('[data-securegpt-banner]').forEach((el) => el.remove())
}
