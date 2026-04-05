// ─────────────────────────────────────────────
// DOM Utils
// Platform-specific input selectors + image paste helpers
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
  const input = findMainEditor()
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

// ── Image paste re-injection ──────────────────

/**
 * Shared bypass set — elements added here will be ignored by all
 * interceptors in the next tick, preventing infinite loops when
 * the extension re-dispatches a masked asset.
 */
export const bypassSet = new WeakSet<Element>()

/**
 * Helper: convert a data URL to a Blob.
 * Tries fetch() first (fastest); falls back to manual base64 decoding
 * if Content Security Policy blocks fetch of a data URL.
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  try {
    const res = await fetch(dataUrl)
    return await res.blob()
  } catch {
    const [header, base64] = dataUrl.split(',')
    const mimeType = header?.split(':')?.[1]?.split(';')?.[0] ?? 'image/png'
    const bytes = atob(base64 ?? '')
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    return new Blob([arr], { type: mimeType })
  }
}

/**
 * Re-inject a (possibly redacted) image into the LLM chat box by dispatching
 * a synthetic ClipboardEvent with the image File attached.
 */
export async function dispatchImagePaste(el: HTMLElement, dataUrl: string): Promise<void> {
  bypassSet.add(el)
  el.focus()
  const blob = await dataUrlToBlob(dataUrl)
  const file = new File([blob], 'masked_image.png', { type: blob.type })
  const dt = new DataTransfer()
  dt.items.add(file)
  el.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true, composed: true })
  )
  setTimeout(() => bypassSet.delete(el), 1500)
}

/**
 * Re-inject a redacted non-image file (e.g. a PDF) the same way.
 */
export async function dispatchFilePaste(
  el: HTMLElement,
  dataUrl: string,
  fileName: string,
  mimeType: string
): Promise<void> {
  bypassSet.add(el)
  el.focus()
  const blob = await dataUrlToBlob(dataUrl)
  const file = new File([blob], fileName, { type: mimeType })
  const dt = new DataTransfer()
  dt.items.add(file)
  el.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true, composed: true })
  )
  setTimeout(() => bypassSet.delete(el), 3500)
}

/**
 * Attempts to clear existing image/file attachments from the site's UI.
 * This is a safeguard to remove the unredacted original upload before we inject the masked one.
 */
export async function clearAttachments() {
  const selectors = [
    'button[aria-label*="Remove"]',
    'button[aria-label*="Cancel"]',
    'button[aria-label*="Clear"]',
    '.X-button', 
    '[class*="remove-button"]',
    '[class*="CancelButton"]',
    'button.absolute:has(svg)', 
    'button:has(svg[class*="icon-sm"])', 
  ];
    
  let cleared = 0;
  for (const sel of selectors) {
    try {
      const btns = document.querySelectorAll<HTMLElement>(sel);
      for (const btn of btns) {
        if (btn.offsetParent !== null) { 
          btn.click();
          cleared++;
        }
      }
    } catch (_e) { }
  }
    
  // Level 2 Heuristics: Search every button or role="button"
  if (cleared === 0) {
    const clickables = document.querySelectorAll('button, [role="button"]');
    for (const btn of Array.from(clickables) as HTMLElement[]) {
      // Must be visible and relatively small (icon buttons)
      const rect = btn.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 60 && rect.height > 0 && rect.height < 60 && btn.offsetParent !== null) {
        
        // Walk upwards to find a container that represents an attachment or image pill
        const container = btn.closest('[class*="attachment"], [class*="file"], .group, li, div[data-testid*="attachment"]');
        if (container) {
          // Does this container hold an image, canvas, or video thumbnail?
          const hasImage = !!container.querySelector('img, canvas, video, [style*="background-image"]');
          if (hasImage) {
            btn.click();
            cleared++;
            continue;
          }
        }

        // Alternative: If the button ITSELF is positioned right next to an image
        const previousSib = btn.previousElementSibling;
        const nextSib = btn.nextElementSibling;
        if ((previousSib && (previousSib.tagName === 'IMG' || previousSib.tagName === 'CANVAS')) ||
            (nextSib && (nextSib.tagName === 'IMG' || nextSib.tagName === 'CANVAS'))) {
          btn.click();
          cleared++;
        }
      }
    }
  }

  console.info(`[SecureGPT] clearAttachments: clicked ${cleared} remove/cancel buttons.`);
  if (cleared > 0) {
    await new Promise(r => setTimeout(r, 600)); 
  }
}
