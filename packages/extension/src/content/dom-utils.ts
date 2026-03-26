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
  'div[contenteditable="true"].ProseMirror',
  'div[contenteditable="true"]',
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

/**
 * From a target (which may be an inner element in contenteditable),
 * walk up to find the actual contenteditable/textarea root.
 */
export function findEditableRoot(target: EventTarget | null): HTMLElement | null {
  if (!target || !(target instanceof Element)) return null;

  if (target.tagName === 'TEXTAREA') return target as HTMLElement;

  const ce = target.closest<HTMLElement>(
    '[contenteditable="true"],[contenteditable="plaintext-only"],[contenteditable=""],[role="textbox"],[role="combobox"]'
  );
  if (ce) return ce;

  return null;
}

/**
 * Specifically look for the main chat input editor on LLM sites using known selectors.
 * Fallback for when we don't have an event target.
 */
export function findMainEditor(): HTMLElement | null {
  // 1. Try focused element first
  const active = document.activeElement;
  const root = findEditableRoot(active);
  if (root && isVisible(root)) return root;

  // 2. Try known selectors
  for (const selector of INPUT_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el && isVisible(el)) return el
  }

  return null;
}

export function extractText(el: HTMLElement): string {
  if (el.tagName === 'TEXTAREA') {
    return (el as HTMLTextAreaElement).value
  }

  // contenteditable div
  return (el.innerText ?? el.textContent ?? '').replace(/\n$/, '').trim()
}


function isVisible(el: HTMLElement): boolean {
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
