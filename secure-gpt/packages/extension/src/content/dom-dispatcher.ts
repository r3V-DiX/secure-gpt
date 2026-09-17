// packages/extension/src/content/dom-dispatcher.ts
// Synthetic event dispatchers & attachment management for LLM DOM inputs

export const bypassSet = new WeakSet<Element>()

/**
 * Helper: convert a data URL to a Blob.
 * Tries fetch() first (fastest); falls back to manual base64 decoding
 * if Content Security Policy blocks fetch of a data URL.
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
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
  setTimeout(() => bypassSet.delete(el), 50)
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
  setTimeout(() => bypassSet.delete(el), 50)
}

/**
 * Attempts to clear existing image/file attachments from the site's UI.
 * This is a safeguard to remove the unredacted original upload before we inject the masked one.
 */
export async function clearAttachments(): Promise<void> {
  const selectors = [
    'button[aria-label*="Remove"]',
    'button[aria-label*="Cancel"]',
    'button[aria-label*="Clear"]',
    '.X-button', 
    '[class*="remove-button"]',
    '[class*="CancelButton"]',
    'button.absolute:has(svg):not([aria-label*="Send"]):not([aria-label*="Submit"])', 
    'button:has(svg[class*="icon-sm"])', 
  ]
    
  let cleared = 0
  for (const sel of selectors) {
    try {
      const btns = document.querySelectorAll<HTMLElement>(sel)
      for (const btn of btns) {
        const aria = (btn.getAttribute('aria-label') || '').toLowerCase()
        const testid = (btn.getAttribute('data-testid') || '').toLowerCase()
        if (aria.includes('send') || aria.includes('submit') || testid.includes('send') || testid.includes('composer-button')) {
          continue
        }

        if (btn.offsetParent !== null) { 
          btn.click()
          cleared++
        }
      }
    } catch (_e) {
      // ignore
    }
  }
    
  if (cleared === 0) {
    const clickables = document.querySelectorAll('button, [role="button"]')
    for (const btn of Array.from(clickables) as HTMLElement[]) {
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase()
      const testid = (btn.getAttribute('data-testid') || '').toLowerCase()
      if (aria.includes('send') || aria.includes('submit') || testid.includes('send') || testid.includes('composer-button')) {
        continue
      }

      const rect = btn.getBoundingClientRect()
      if (rect.width > 0 && rect.width < 60 && rect.height > 0 && rect.height < 60 && btn.offsetParent !== null) {
        const container = btn.closest('[class*="attachment"], [class*="file"], [data-testid*="attachment"], li')
        if (container) {
          const hasImage = !!container.querySelector('img, canvas, video, [style*="background-image"]')
          if (hasImage) {
            btn.click()
            cleared++
            continue
          }
        }

        const previousSib = btn.previousElementSibling
        const nextSib = btn.nextElementSibling
        if ((previousSib && (previousSib.tagName === 'IMG' || previousSib.tagName === 'CANVAS')) ||
            (nextSib && (nextSib.tagName === 'IMG' || nextSib.tagName === 'CANVAS'))) {
          btn.click()
          cleared++
        }
      }
    }
  }

  console.info(`[SecureGPT] clearAttachments: clicked ${cleared} remove/cancel buttons.`)
  if (cleared > 0) {
    await new Promise(r => setTimeout(r, 600))
  }
}
