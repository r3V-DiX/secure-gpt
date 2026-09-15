// packages/extension/src/background/offscreen-proxy.ts

let creating: Promise<void> | null = null

export async function setupOffscreen() {
  const offscreenUrl = chrome.runtime.getURL('src/offscreen/offscreen.html')

  if (typeof chrome.runtime.getContexts !== 'undefined') {
    const existing = await chrome.runtime.getContexts({
      contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
      documentUrls: [offscreenUrl],
    })
    if (existing.length > 0) return
  }

  if (creating) {
    await creating
    return
  }

  try {
    creating = chrome.offscreen.createDocument({
      url: offscreenUrl,
      reasons: [chrome.offscreen.Reason.DOM_PARSER],
      justification: 'Run Tesseract.js OCR engine in a worker-enabled context',
    })
    await creating
  } catch (err) {
    if (!String(err).includes('Only a single offscreen document may be created')) {
      console.error('[Background] Failed to create offscreen document:', err)
    }
  } finally {
    creating = null
  }
}

export async function ensureOffscreenReady(): Promise<boolean> {
  await setupOffscreen()
  for (let i = 0; i < 15; i++) {
    try {
      const ping: { ok: boolean } = await chrome.runtime.sendMessage({ action: 'OFFSCREEN_PING' })
      if (ping?.ok) return true
    } catch (_e) {
      console.debug(`[Background] Offscreen not ready yet (attempt ${i + 1}), waiting…`)
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}
