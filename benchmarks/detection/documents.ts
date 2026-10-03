import { detectPII, detectPIIFromImage } from '@securegpt/detection'
import { DEFAULT_PII_CONFIG, type DocumentScan, type DocumentEntity } from '@securegpt/shared/types'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { applyImageMasking } from '../../secure-gpt/packages/extension/src/features/actions/services/masking.service'

// Serve only built local assets; exercise the same worker paths as the extension.
Object.assign(window, { chrome: { runtime: { getURL: (path: string) => `${location.origin}/${path}` } } })
const policy = structuredClone(DEFAULT_PII_CONFIG)
for (const category of Object.values(policy.categories)) { category.enabled = true; category.action = 'BLOCK' }
const status = document.querySelector('#status')!
const output = document.querySelector('#results')!
const results: { name: string; run: number; milliseconds: number; findings: number; boxes: number; verified: boolean; error?: string; expected?: number; matched?: number; missingBoxes?: string[] }[] = []
const syntheticText = 'Private contact: mira.private@example.test'
async function maskedPixels(source: string, entities: DocumentEntity[]): Promise<boolean> {
  const image = new Image()
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = source })
  const canvas = document.createElement('canvas')
  canvas.width = image.width; canvas.height = image.height
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, image.width, image.height).data
  return entities.every(entity => !!entity.bboxes?.length && entity.bboxes.every(box => {
    for (let y = Math.ceil(box.y0); y < Math.floor(box.y1); y++) {
      for (let x = Math.ceil(box.x0); x < Math.floor(box.x1); x++) {
        const offset = (y * image.width + x) * 4
        if (pixels[offset]! > 20 || pixels[offset + 1]! > 20 || pixels[offset + 2]! > 20) return false
      }
    }
    return true
  }))
}
const toDataUrl = (bytes: Uint8Array, type: string): Promise<string> => new Promise(resolve => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result as string)
  reader.readAsDataURL(new Blob([new Uint8Array(bytes)], { type }))
})

function image(rotated = false): string {
  const canvas = document.createElement('canvas')
  canvas.width = rotated ? 300 : 1100
  canvas.height = rotated ? 1100 : 300
  const context = canvas.getContext('2d')!
  context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height)
  if (rotated) { context.translate(300, 0); context.rotate(Math.PI / 2) }
  context.fillStyle = 'black'; context.font = '32px Arial'
  context.fillText('Confidential account summary for testing', 35, 70)
  context.fillText(syntheticText, 35, 145)
  context.fillText('Please keep this document private.', 35, 220)
  return canvas.toDataURL('image/png')
}

async function pdf(scanned: boolean, mixed = false): Promise<string> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage([600, 400])
  if (scanned) {
    const raster = await doc.embedPng(image())
    page.drawImage(raster, { x: 0, y: 100, width: 600, height: 164 })
    if (mixed) page.drawText('A PDF with both readable text and a private screenshot.', { x: 20, y: 350, size: 16, font })
  } else {
    page.drawText(syntheticText, { x: 20, y: 250, size: 18, font })
    const second = doc.addPage([600, 400])
    second.drawText('Another contact: second.private@example.test', { x: 20, y: 250, size: 18, font })
  }
  return toDataUrl(await doc.save(), 'application/pdf')
}

function report(): void {
  const warm = results.filter(result => result.run > 0 && !result.error).map(result => result.milliseconds).sort((a, b) => a - b)
  output.textContent = JSON.stringify({
    warmMedianMs: warm[Math.floor(warm.length / 2)],
    warmP95Ms: warm[Math.max(0, Math.ceil(warm.length * .95) - 1)],
    allVerified: results.every(result => result.verified), results,
  }, null, 2)
}

async function run(name: string, data: string, runIndex: number, isPdf: boolean, expected: string[] = []): Promise<void> {
  status.textContent = `Processing ${name}, ${runIndex === 0 ? 'first run' : 'warm run ' + runIndex}…`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120_000)
  const start = performance.now()
  let session: InstanceType<typeof import('../../secure-gpt/packages/extension/src/offscreen/document-pdf').DocumentPdf> | undefined
  let detection: DocumentScan | undefined
  try {
    let safe: string
    if (isPdf) {
      const { DocumentPdf } = await import('../../secure-gpt/packages/extension/src/offscreen/document-pdf')
      session = new DocumentPdf()
      detection = await session.scan(data, policy, controller.signal,
        text => detectPII(text, policy, { strict: true, signal: controller.signal }),
        url => detectPIIFromImage(url, policy, { strict: true, signal: controller.signal }), () => undefined)
      safe = await session.redact(detection.entities, controller.signal)
    } else {
      detection = await detectPIIFromImage(data, policy, { strict: true, signal: controller.signal })
      safe = await applyImageMasking(data, detection.entities)
    }
    const milliseconds = Math.round(performance.now() - start)
    let verified = !!detection.entities.length && detection.entities.every(entity => entity.bboxes?.length) && safe !== data
    const normalized = (text: string) => text.toLowerCase().replace(/[\s-]+/g, '')
    const matched = expected.filter(value => detection!.entities.some(entity => normalized(entity.value).includes(normalized(value)))).length
    verified &&= matched === expected.length
    if (isPdf) {
      const pdfjs = await import('pdfjs-dist')
      const bytes = new Uint8Array(await (await fetch(safe)).arrayBuffer())
      const task = pdfjs.getDocument({ data: bytes })
      const document = await task.promise
      const original = pdfjs.getDocument({ data: new Uint8Array(await (await fetch(data)).arrayBuffer()) })
      verified &&= (await original.promise).numPages === document.numPages
      await original.destroy()
      for (let page = 1; page <= document.numPages; page++) {
        const outputPage = await document.getPage(page)
        verified &&= (await outputPage.getTextContent()).items.length === 0
        const viewport = outputPage.getViewport({ scale: 200 / 72 })
        const canvas = window.document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
        await outputPage.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
        verified &&= await maskedPixels(canvas.toDataURL('image/png'), detection.entities.filter(entity => entity.page === page - 1))
      }
      await task.destroy()
    } else {
      verified &&= await maskedPixels(safe, detection.entities)
      const preview = document.createElement('img')
      preview.src = safe; preview.alt = `Redacted ${name}`
      document.querySelector('#preview')!.replaceChildren(preview)
    }
    results.push({ name, run: runIndex, milliseconds, findings: detection.entities.length, boxes: detection.entities.reduce((n, e) => n + (e.bboxes?.length ?? 0), 0), expected: expected.length, matched, verified })
  } catch (error) {
    results.push({ name, run: runIndex, milliseconds: Math.round(performance.now() - start), findings: detection?.entities.length ?? 0, boxes: 0, verified: false, error: String(error), missingBoxes: detection?.entities.filter(entity => !entity.bboxes?.length).map(entity => `${entity.ruleId}:${entity.startIndex}-${entity.endIndex}`) })
  } finally { clearTimeout(timer); session?.dispose(); report() }
}

async function suite(corpus: boolean): Promise<void> {
  for (const button of document.querySelectorAll('button')) button.disabled = true
  results.length = 0
  try {
    if (corpus) {
      const gold = (await (await fetch('/fixtures/ground_truth.jsonl')).text()).trim().split('\n').map(line => JSON.parse(line))
      const fixtures = ['anshul_pan.png', 'anshul_aadhar.png', 'passport.jpg', 'indianpp.jpg', 'test_financial_doc.png', 'test_medical_doc.png', 'test_technical_doc.png']
      for (const name of fixtures) {
        const response = await fetch(`/fixtures/${name}`)
        if (!response.ok) throw new Error('Copy test_documents/images to dist/fixtures first')
        const data = await toDataUrl(new Uint8Array(await response.arrayBuffer()), name.endsWith('.jpg') ? 'image/jpeg' : 'image/png')
        const expected = [...new Set<string>(gold.filter(sample => sample.imagePath === name).flatMap(sample => sample.expectedEntities.map((entity: { value: string }) => entity.value)))]
        await run(name, data, 0, false, expected)
        await run(name, data, 1, false, expected)
      }
    } else {
      const samples = [
        { name: 'upright-image', data: image(), pdf: false },
        { name: 'rotated-image', data: image(true), pdf: false },
        { name: 'text-pdf-two-pages', data: await pdf(false), pdf: true },
        { name: 'scanned-pdf', data: await pdf(true), pdf: true },
        { name: 'mixed-pdf', data: await pdf(true, true), pdf: true },
      ]
      for (let iteration = 0; iteration < 3; iteration++) for (const sample of samples) await run(sample.name, sample.data, iteration, sample.pdf, ['mira.private@example.test'])
    }
    status.textContent = 'Complete'
  } catch (error) { status.textContent = String(error) }
  finally { for (const button of document.querySelectorAll('button')) button.disabled = false }
}
document.querySelector('#synthetic')!.addEventListener('click', () => void suite(false))
document.querySelector('#corpus')!.addEventListener('click', () => void suite(true))
status.textContent = 'Ready — test modules loaded'
