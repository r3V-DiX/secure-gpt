import * as pdfjs from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'

pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('assets/pdf.worker.min.mjs')

export interface PdfTextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
}

export interface PdfPageInfo {
  pageNumber: number
  width: number
  height: number
  textItems: PdfTextItem[]
}

export interface PdfRegion {
  page: number
  x: number
  y: number
  width: number
  height: number
}

let lastPdfPages: PdfPageInfo[] = []

export async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const resp = await fetch(dataUrl)
  const arrayBuffer = await resp.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

export async function runPdfProcessing(pdfData: string) {
  const uint8Array = await dataUrlToUint8Array(pdfData)
  const loadingTask = pdfjs.getDocument({ data: uint8Array })
  const pdf = await loadingTask.promise
  let fullText = ''
  const pages: PdfPageInfo[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()

    const items = textContent.items.map((item: any) => ({
      str: item.str || '',
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
      width: item.width ?? 0,
      height: item.height ?? 0
    }))

    const pageText = items.map((it: any) => it.str).join(' ')
    fullText += `--- Page ${i} ---\n` + pageText + '\n'

    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      textItems: items
    })
  }

  lastPdfPages = pages

  return {
    numPages: pdf.numPages,
    fullText,
    pages
  }
}

export function getRegionsForValues(values: string[]) {
  const regions: PdfRegion[] = []
  const lowerValues = values.map((v) => v.toLowerCase().trim()).filter((v) => v.length > 1)

  lastPdfPages.forEach((page, pageIdx) => {
    page.textItems.forEach((item) => {
      const itemText = (item.str || '').toLowerCase()
      for (const val of lowerValues) {
        if (itemText.includes(val)) {
          regions.push({
            page: pageIdx,
            x: item.x,
            y: page.height - item.y - (item.height || 12),
            width: item.width || (val.length * 6),
            height: item.height || 12
          })
          break
        }
      }
    })
  })

  return regions
}

export async function runPdfRedactionLocal(pdfData: string, entities: any[]) {
  try {
    const uint8Array = await dataUrlToUint8Array(pdfData)
    const loadingTask = pdfjs.getDocument({ data: uint8Array })
    const pdf = await loadingTask.promise

    const scale = 1.5
    const textValues = (entities || [])
      .map((e: any) => (e.value || '').toLowerCase().trim())
      .filter((v: string) => v.length > 1)

    const outPdf = await PDFDocument.create()

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error(`Failed to create canvas context for page ${pageNum}`)

      await page.render({ canvasContext: ctx, viewport }).promise

      const textContent = await page.getTextContent()
      ctx.fillStyle = 'black'

      textContent.items.forEach((item: any) => {
        const itemText = (item.str || '').toLowerCase()
        for (const val of textValues) {
          if (itemText.includes(val) || (itemText.length > 3 && val.includes(itemText))) {
            const tx = item.transform?.[4] ?? 0
            const ty = item.transform?.[5] ?? 0
            const tw = item.width || (val.length * 6)
            const th = item.height || 12

            const canvasX = tx * scale
            const canvasY = viewport.height - (ty + th) * scale
            const canvasW = Math.max(tw * scale, 20)
            const canvasH = Math.max(th * scale, 14)

            ctx.fillRect(canvasX - 4, canvasY - 2, canvasW + 8, canvasH + 4)
            break
          }
        }
      })

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
      if (!blob) throw new Error(`Failed to create image blob for page ${pageNum}`)
      const arrayBuffer = await blob.arrayBuffer()
      const embeddedImage = await outPdf.embedPng(new Uint8Array(arrayBuffer))
      const pdfPage = outPdf.addPage([viewport.width / scale, viewport.height / scale])
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: viewport.width / scale,
        height: viewport.height / scale
      })
    }

    const pdfBytes = await outPdf.save()
    const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const reader = new FileReader()
    const redactedDataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(pdfBlob)
    })

    return { ok: true as const, redactedPdfData: redactedDataUrl }
  } catch (err) {
    console.error('[Offscreen] Local PDF redaction error:', err)
    return { ok: false as const, error: String(err) }
  }
}
