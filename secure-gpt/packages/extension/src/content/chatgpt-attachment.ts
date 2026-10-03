import { dataUrlToBlob } from './dom-dispatcher'

export const approvedUploadEvents = new WeakSet<Event>()
export interface AttachmentTarget { input?: HTMLInputElement | undefined; url: string }

function editor(): HTMLElement | null {
  return document.querySelector(
    '#prompt-textarea, #mobile-composer-prompt, div[contenteditable="true"][data-id="root"], div[contenteditable="true"].ProseMirror, [contenteditable="true"][data-placeholder], textarea[name="prompt-textarea"], div[contenteditable="true"][role="textbox"], textarea[placeholder*="Ask"]'
  )
}

/** Only composer-scoped attachment evidence counts, never extension banners. */
function evidence(scope: Element, fileName: string): Set<Element> {
  return new Set(Array.from(scope.querySelectorAll('[data-testid*="attachment"], [data-testid*="file-thumbnail"], [aria-label], [title], img')).filter(element => {
    const label = `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('alt') ?? ''}`
    const testId = element.getAttribute('data-testid') ?? ''
    return label.includes(fileName) || (/attachment|file-thumbnail/.test(testId) && !!element.textContent?.includes(fileName))
  }))
}

export async function attachChatGptFile(file: File, target: AttachmentTarget, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  if (location.href !== target.url) throw new Error('DOCUMENT_NAVIGATED')
  const composer = editor()
  if (!composer) throw new Error('DOCUMENT_COMPOSER_MISSING')
  const scope = composer.closest('form') ?? composer.parentElement
  if (!scope) throw new Error('DOCUMENT_COMPOSER_MISSING')
  const input = target.input?.isConnected ? target.input :
    scope.querySelector<HTMLInputElement>('#octane-mobile-composer-files-input, input[type="file"]:not([accept])') ??
    Array.from(scope.querySelectorAll<HTMLInputElement>('input[type="file"]')).find(candidate =>
      !candidate.accept || candidate.accept.split(',').some(accept => {
        const value = accept.trim()
        return value === '*/*' || value === file.type || (value.endsWith('/*') && file.type.startsWith(value.slice(0, -1))) || file.name.toLowerCase().endsWith(value.toLowerCase())
      }))
  const before = evidence(scope, file.name)
  const transfer = new DataTransfer()
  transfer.items.add(file)
  // Observe before dispatch: ChatGPT may render the attachment synchronously.
  await new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer)
      observer.disconnect()
      signal.removeEventListener('abort', aborted)
      error ? reject(error) : resolve()
    }
    const check = () => {
      if (location.href !== target.url) { finish(new Error('DOCUMENT_ATTACHMENT_UNCONFIRMED')); return }
      const added = [...evidence(scope, file.name)].filter(element => !before.has(element))
      if (added.length) finish()
    }
    const observer = new MutationObserver(check)
    const aborted = () => finish(new Error('DOCUMENT_ATTACHMENT_UNCONFIRMED'))
    const timer = setTimeout(() => finish(new Error('DOCUMENT_ATTACHMENT_UNCONFIRMED')), 10_000)
    signal.addEventListener('abort', aborted, { once: true })
    observer.observe(scope, { subtree: true, childList: true, attributes: true })
    try {
      signal.throwIfAborted()
      if (input) {
        input.files = transfer.files
        const change = new Event('change', { bubbles: true, composed: true })
        approvedUploadEvents.add(change)
        input.dispatchEvent(change)
      } else {
        const paste = new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true, composed: true })
        approvedUploadEvents.add(paste)
        composer.dispatchEvent(paste)
      }
      check()
    } catch { finish(new Error('DOCUMENT_ATTACHMENT_UNCONFIRMED')) }
  })
}

export async function redactedFile(original: File, dataUrl: string): Promise<File> {
  const blob = await dataUrlToBlob(dataUrl)
  const isImage = original.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(original.name)
  const name = isImage ? original.name.replace(/\.[^.]+$/, '') + '.redacted.png' : original.name.replace(/(\.[^.]+)$/, '.redacted$1')
  const type = isImage ? 'image/png' : original.type || blob.type
  return new File([blob], name, { type, lastModified: Date.now() })
}
