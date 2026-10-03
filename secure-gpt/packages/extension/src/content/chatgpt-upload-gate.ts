import type { DocumentProgress, PIIConfig } from '@securegpt/shared/types'
import { approvedUploadEvents } from './chatgpt-attachment'
import { DocumentUploads } from './document-uploads'

export function isChatGptHost(): boolean { return ['chatgpt.com', 'chat.openai.com'].includes(location.hostname) }

/** Installed synchronously, before auth/policy retrieval or page initialization. */
export function installChatGptUploadGate() {
  const uploads = new DocumentUploads()
  let policy: PIIConfig | null | undefined
  let url = location.href
  const enabled = isChatGptHost()
  const capture = (event: Event) => {
    if (!enabled || policy === null || approvedUploadEvents.has(event) || !event.isTrusted) return
    let files: File[] = []
    let input: HTMLInputElement | undefined
    if ((event.type === 'input' || event.type === 'change') && event.target instanceof HTMLInputElement && event.target.type === 'file') {
      input = event.target
      files = Array.from(input.files ?? [])
    } else if (event.type === 'paste') {
      files = Array.from((event as ClipboardEvent).clipboardData?.files ?? [])
    } else if (event.type === 'drop') {
      files = Array.from((event as DragEvent).dataTransfer?.files ?? [])
    }
    if (!files.length) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (input) input.value = ''
    for (const file of files) uploads.add(file, { input, url: location.href }, policy ?? undefined)
  }
  const guardSend = (event: Event) => {
    if (!uploads.unresolved) return
    const target = event.target instanceof Element ? event.target : null
    const key = event as KeyboardEvent
    const sending = event.type === 'submit' ||
      (event.type === 'keydown' && key.key === 'Enter' && !key.shiftKey && !!target?.closest('#prompt-textarea, textarea, [contenteditable="true"]')) ||
      (event.type === 'click' && !!target?.closest('button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="Submit"], button[type="submit"]'))
    if (sending) { event.preventDefault(); event.stopImmediatePropagation() }
  }
  const progress = (message: DocumentProgress) => {
    if (message.type === 'DOCUMENT_PROGRESS') uploads.progress(message)
  }
  const navigation = () => {
    if (location.href !== url) { uploads.cancelAll(); url = location.href }
  }
  const leave = () => uploads.cancelAll()
  if (enabled) {
    for (const type of ['input', 'change', 'paste', 'drop']) window.addEventListener(type, capture, true)
    for (const type of ['click', 'keydown', 'submit']) window.addEventListener(type, guardSend, true)
    window.addEventListener('pagehide', leave)
    window.addEventListener('popstate', navigation)
  }
  const poll = enabled ? setInterval(navigation, 250) : undefined
  return {
    progress,
    setPolicy(next: PIIConfig | null) {
      if (!enabled) return
      const effective = next?.enableDocumentScanning === false ? null : next
      if (policy !== undefined && JSON.stringify(policy) !== JSON.stringify(effective)) uploads.cancelAll()
      policy = effective
      uploads.configure(policy)
      if (policy) { try { chrome.runtime.sendMessage({ type: 'DOCUMENT_WARM' }, () => { void chrome.runtime.lastError }) } catch { /* Scans report the error. */ } }
    },
    invalidate() { uploads.cancelAll(); policy = undefined },
    dispose() {
      uploads.cancelAll()
      if (poll) clearInterval(poll)
      for (const type of ['input', 'change', 'paste', 'drop']) window.removeEventListener(type, capture, true)
      for (const type of ['click', 'keydown', 'submit']) window.removeEventListener(type, guardSend, true)
      window.removeEventListener('pagehide', leave)
      window.removeEventListener('popstate', navigation)
    },
  }
}
