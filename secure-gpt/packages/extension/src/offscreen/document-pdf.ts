import * as pdfjs from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'
import type { DocumentEntity, DocumentScan, PIIConfig } from '@securegpt/shared/types'
import { documentMasks } from '@securegpt/shared/types'
import { dataUrlToUint8Array } from './pdf-service'
import { applyImageMasking } from '@/features/actions/services/masking.service'
import { pdfTextLayout } from './document-pdf-text'

type DetectText = (text: string, config: PIIConfig) => Promise<DocumentScan>
type DetectImage = (url: string, config: PIIConfig, signal: AbortSignal) => Promise<DocumentScan>
interface PageScan { image?: string | undefined; width: number; height: number; entities: DocumentEntity[] }
const SCALE = 200 / 72
const IMAGE_OPS = new Set([pdfjs.OPS.paintImageXObject, pdfjs.OPS.paintInlineImageXObject, pdfjs.OPS.paintImageXObjectRepeat, pdfjs.OPS.paintImageMaskXObject, pdfjs.OPS.paintImageMaskXObjectGroup, pdfjs.OPS.paintImageMaskXObjectRepeat, pdfjs.OPS.paintInlineImageXObjectGroup, pdfjs.OPS.paintSolidColorImageMask])

export class DocumentPdf {
  private pages: PageScan[] = []
  private loading: ReturnType<typeof pdfjs.getDocument> | null = null
  private pdf: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']> | null = null

  async scan(dataUrl: string, config: PIIConfig, signal: AbortSignal, detectText: DetectText, detectImage: DetectImage,
    progress: (page: number, pages: number, sensitive: boolean) => void): Promise<DocumentScan> {
    const started = performance.now()
    this.loading = pdfjs.getDocument({ data: await dataUrlToUint8Array(dataUrl), isEvalSupported: false })
    this.pdf = await this.loading.promise
    if (this.pdf.numPages > 200) throw new Error('DOCUMENT_TOO_LARGE')
    let inputLength = 0
    let totalPixels = 0
    const entities: DocumentEntity[] = []
    for (let index = 0; index < this.pdf.numPages; index++) {
      signal.throwIfAborted()
      const page = await this.pdf.getPage(index + 1)
      const viewport = page.getViewport({ scale: SCALE })
      totalPixels += viewport.width * viewport.height
      if (totalPixels > 120_000_000) throw new Error('DOCUMENT_TOO_LARGE')
      const content = await page.getTextContent()
      const { text, spans } = pdfTextLayout(content.items.filter(item => 'str' in item), content.styles,
        (x, y) => viewport.convertToViewportPoint(x, y))
      const textResult = await detectText(text, config)
      const pageEntities: DocumentEntity[] = textResult.entities.map(entity => ({
        ...entity, id: `${index}:text:${entity.id}`, page: index,
        bboxes: spans.filter(span => span.start < entity.endIndex && span.end > entity.startIndex).map(span => span.box),
      }))
      inputLength += text.length
      const operators = await page.getOperatorList()
      const hasImages = operators.fnArray.some(op => IMAGE_OPS.has(op))
      // A text layer does not account for screenshots/images embedded on the page.
      let image: string | undefined
      if (hasImages || !text.trim()) {
        image = await this.render(index, signal)
        const ocr = await detectImage(image, config, signal)
        inputLength += ocr.inputLength
        pageEntities.push(...ocr.entities.map(entity => ({ ...entity, id: `${index}:ocr:${entity.id}`, page: index })))
      }
      this.pages.push({ image, width: viewport.width / SCALE, height: viewport.height / SCALE, entities: pageEntities })
      entities.push(...pageEntities)
      progress(index + 1, this.pdf.numPages, documentMasks(entities, config).length > 0)
      await new Promise(resolve => setTimeout(resolve, 0))
    }
    return { hasFindings: entities.length > 0, entities, tier: 'ocr', inputLength, processingTimeMs: performance.now() - started }
  }

  private async render(index: number, signal: AbortSignal): Promise<string> {
    signal.throwIfAborted()
    const page = await this.pdf!.getPage(index + 1)
    const viewport = page.getViewport({ scale: SCALE })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('DOCUMENT_CANVAS_UNAVAILABLE')
    const task = page.render({ canvasContext: context, viewport })
    const cancel = () => task.cancel()
    signal.addEventListener('abort', cancel, { once: true })
    try {
      await task.promise
      signal.throwIfAborted()
      return canvas.toDataURL('image/png')
    } finally {
      signal.removeEventListener('abort', cancel)
      canvas.width = canvas.height = 0
    }
  }

  async redact(selected: DocumentEntity[], signal: AbortSignal): Promise<string> {
    if (!this.pdf || this.pages.length !== this.pdf.numPages) throw new Error('DOCUMENT_INCOMPLETE_SCAN')
    if (!selected.length || selected.some(entity => !Number.isInteger(entity.page) || entity.page! < 0 || entity.page! >= this.pages.length || !entity.bboxes?.length)) {
      throw new Error('DOCUMENT_MISSING_REDACTION_BOXES')
    }
    const output = await PDFDocument.create()
    for (let index = 0; index < this.pages.length; index++) {
      signal.throwIfAborted()
      const page = this.pages[index]!
      const matches = selected.filter(entity => entity.page === index)
      const source = page.image ?? await this.render(index, signal)
      const safeImage = matches.length ? await applyImageMasking(source, matches) : source
      const image = await output.embedPng(await dataUrlToUint8Array(safeImage))
      output.addPage([page.width, page.height]).drawImage(image, { x: 0, y: 0, width: page.width, height: page.height })
      // Release page raster as soon as it is embedded in the output.
      page.image = undefined
    }
    signal.throwIfAborted()
    // Fresh image-only PDF: no original text, metadata, annotations or attachments.
    const bytes = await output.save()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('DOCUMENT_OUTPUT_FAILED'))
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }))
    })
  }

  dispose(): void {
    this.pages = []
    void this.loading?.destroy().catch(() => undefined)
    this.pdf = null
    this.loading = null
  }
}
