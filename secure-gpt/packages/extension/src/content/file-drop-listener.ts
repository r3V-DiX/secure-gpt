// packages/extension/src/content/file-drop-listener.ts
// Handlers for file drag & drop, file inputs, and clipboard paste attachments

import { findEditableRoot, findMainEditor, bypassSet } from './dom-utils'
import { handleFileScan, handleImagePasteInternal, isOfficeFile } from './file-scanner'
import type { PIIConfig, PIIEntity } from '@securegpt/shared/types'

export interface FileListenerContext {
  getCurrentPolicy: () => PIIConfig
  ocrCache: Map<string, PIIEntity[]>
  incPending: () => void
  decPending: () => void
  getPendingCount: () => number
}

export function handleGlobalPaste(ev: ClipboardEvent, ctx: FileListenerContext): void {
  if (!ev.isTrusted) return
  const items = ev.clipboardData?.items
  if (!items) return

  let targetItem: DataTransferItem | null = null
  const itemList = Array.from(items as unknown as DataTransferItem[])
  for (const item of itemList) {
    const blob = item.kind === 'file' ? item.getAsFile() : null
    if (item.type.startsWith('image/') || item.type === 'application/pdf' || (blob && isOfficeFile(blob))) {
      targetItem = item
      break
    }
  }
  if (!targetItem) return

  const el = findEditableRoot(ev.target) ?? findEditableRoot(document.activeElement)
  if (!el || bypassSet.has(el)) return

  ev.preventDefault()
  ev.stopImmediatePropagation()

  const blob = targetItem.getAsFile()
  if (!blob) return

  const isPdf = targetItem.type === 'application/pdf' || blob.name.toLowerCase().endsWith('.pdf')
  const isOffice = isOfficeFile(blob)
  const currentPolicy = ctx.getCurrentPolicy()

  if (isPdf || isOffice) {
    void handleFileScan(el as HTMLElement, blob, currentPolicy, ctx.ocrCache, ctx.incPending, ctx.decPending, ctx.getPendingCount)
  } else {
    const reader = new FileReader()
    reader.onload = () => {
      const imgUrl = reader.result as string
      void handleImagePasteInternal(el as HTMLElement, imgUrl, currentPolicy, ctx.ocrCache, ctx.incPending, ctx.decPending, ctx.getPendingCount)
    }
    reader.readAsDataURL(blob)
  }
}

export function handleGlobalFileChange(ev: Event, ctx: FileListenerContext): void {
  if (!ev.isTrusted) return
  const target = ev.target as HTMLInputElement
  if (target.type !== 'file' || !target.files?.length) return

  const file = target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf') && !isOfficeFile(file)) return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  ev.stopImmediatePropagation()
  target.value = ''
  void handleFileScan(el, file, ctx.getCurrentPolicy(), ctx.ocrCache, ctx.incPending, ctx.decPending, ctx.getPendingCount)
}

export function handleGlobalDrop(ev: DragEvent, ctx: FileListenerContext): void {
  if (!ev.isTrusted) return
  const files = ev.dataTransfer?.files
  if (!files?.length) return

  const file = files[0]
  if (!file) return
  if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf') && !isOfficeFile(file)) return

  const el = findMainEditor() ?? document.body as HTMLElement
  if (bypassSet.has(el)) return

  ev.preventDefault()
  ev.stopImmediatePropagation()
  void handleFileScan(el, file, ctx.getCurrentPolicy(), ctx.ocrCache, ctx.incPending, ctx.decPending, ctx.getPendingCount)
}
