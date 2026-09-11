// packages/extension/src/content/text-replacer.ts
// Handles safe DOM text replacement and synthetic resubmission into LLM prompt areas

import { findSendButton, extractText, bypassSet } from './dom-utils'

/**
 * Sets input text into either contenteditable elements (via execCommand / synthetic paste)
 * or standard HTML textareas/inputs without direct innerHTML manipulation.
 */
export function setInputValue(el: HTMLElement, text: string): void {
  if (el.getAttribute('contenteditable')) {
    el.focus()

    const selection = window.getSelection()
    if (selection) {
      const range = document.createRange()
      range.selectNodeContents(el)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    el.dispatchEvent(
      new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
      })
    )

    const success = document.execCommand('insertText', false, text)

    if (!success) {
      // Fallback: inject via synthetic paste so React / ProseMirror handles the update
      bypassSet.add(el)
      const dt = new DataTransfer()
      dt.setData('text/plain', text)
      el.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
          composed: true,
        })
      )
      setTimeout(() => bypassSet.delete(el), 50)
    }
  } else {
    (el as HTMLTextAreaElement).value = text
  }

  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Dispatches Enter key and clicks the send button to re-submit sanitized prompts
 */
export function resubmit(el: HTMLElement): void {
  console.log('[SecureGPT] Resubmitting...')
  bypassSet.add(el)

  const options: KeyboardEventInit = {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    composed: true,
  }
  el.dispatchEvent(new KeyboardEvent('keydown', options))

  setTimeout(() => {
    const text = extractText(el)
    if (text.length > 0) {
      const btn = findSendButton()
      btn?.click()
    }
    setTimeout(() => bypassSet.delete(el), 1000)
  }, 200)
}
