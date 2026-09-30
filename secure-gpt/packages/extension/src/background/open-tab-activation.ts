import { LLM_URL_PATTERNS } from './policy-sync'
import { DOMAIN_TO_PLATFORM } from '@securegpt/shared/constants'

export async function activateTab(tabId: number, knownUrl?: string): Promise<void> {
  try {
    const url = knownUrl ?? (await chrome.tabs.get(tabId)).url
    if (!url || !DOMAIN_TO_PLATFORM[new URL(url).hostname]) return

    try {
      const response = await Promise.race([
        chrome.tabs.sendMessage(tabId, { type: 'SECUREGPT_PING' }),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 500)),
      ])
      if (response?.ready) return
    } catch {
      // A tab opened before installation has no receiving content script.
    }

    await chrome.scripting.executeScript({
      target: { tabId }, files: ['content/index.js'], injectImmediately: true,
    })
  } catch (error) {
    console.warn('[Background] Could not activate tab', tabId, error)
  }
}

export async function activateOpenTabs(): Promise<void> {
  const tabs = await chrome.tabs.query({ url: LLM_URL_PATTERNS })
  await Promise.all(tabs.filter(tab => tab.id).map(tab => activateTab(tab.id!, tab.url)))
}
