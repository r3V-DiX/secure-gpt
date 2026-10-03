// ─────────────────────────────────────────────
// @securegpt/ocr — Universal Document & Image Redactor
// Redacts PII across Images, PDFs, and Structured/Text Documents
// ─────────────────────────────────────────────

import * as fs from 'fs'
import * as path from 'path'
import { execFileSync } from 'child_process'
import { OcrPipeline } from '../src/pipeline/ocrPipeline'
import { TesseractEngine } from '../src/engines/tesseractEngine'
import { detectPII } from '../../../packages/detection/src/pipeline'
import { DEFAULT_PII_CONFIG } from '../../../packages/shared/src/types/config.types'
import { mapEntitiesToBboxes } from '../src/postprocessor/bboxMapper'
import { applyMasking } from '../../../packages/extension/src/features/actions/services/masking.service'
import { drawBoxesOnImage, compileMultiPagePdf } from './redactHelpers'

export interface RedactOptions {
  inputPath?: string
  outputDir?: string
  redactImages?: boolean
  redactPdfs?: boolean
  redactDocs?: boolean
}

export async function redactImageFile(
  imagePath: string,
  outPngPath: string,
  pipeline: OcrPipeline
) {
  const ocrResult = await pipeline.processImage(imagePath)
  const rawText = ocrResult.repairedText || ocrResult.rawText
  const detection = await detectPII(rawText, DEFAULT_PII_CONFIG)

  const mappedEntities = mapEntitiesToBboxes(
    detection.entities,
    ocrResult.ocrData,
    rawText,
    ocrResult.severityFloor,
    ocrResult.scale,
    ocrResult.rotation,
    ocrResult.imgWidth,
    ocrResult.imgHeight
  )

  const allBboxes = mappedEntities.flatMap((e) => (e as any).bboxes || [])
  drawBoxesOnImage(imagePath, outPngPath, allBboxes)

  return {
    rawText,
    entities: detection.entities,
    bboxCount: allBboxes.length,
    outputPath: outPngPath,
  }
}

export async function redactPdfFile(
  pdfPath: string,
  outPdfPath: string,
  outPngPath: string,
  pipeline: OcrPipeline
) {
  const tmpDir = `/tmp/pdf_render_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  fs.mkdirSync(tmpDir, { recursive: true })

  try {
    execFileSync('pdftoppm', ['-png', '-r', '200', pdfPath, path.join(tmpDir, 'page')])

    const pageFiles = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith('page-') && f.endsWith('.png'))
      .sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0
        return numA - numB
      })

    if (pageFiles.length === 0) throw new Error(`Failed to render PDF pages: ${pdfPath}`)

    const totalPages = pageFiles.length
    const redactedPageImages: string[] = []
    let totalEntitiesFound = 0
    let totalBboxesFound = 0

    for (let i = 0; i < pageFiles.length; i++) {
      const pageNum = i + 1
      const pageFile = path.join(tmpDir, pageFiles[i]!)
      const ocrResult = await pipeline.processImage(pageFile)
      const rawText = ocrResult.repairedText || ocrResult.rawText
      const detection = await detectPII(rawText, DEFAULT_PII_CONFIG)

      const mappedEntities = mapEntitiesToBboxes(
        detection.entities,
        ocrResult.ocrData,
        rawText,
        ocrResult.severityFloor,
        ocrResult.scale,
        ocrResult.rotation,
        ocrResult.imgWidth,
        ocrResult.imgHeight
      )

      const allBboxes = mappedEntities.flatMap((e) => (e as any).bboxes || [])
      totalEntitiesFound += detection.entities.length
      totalBboxesFound += allBboxes.length

      const redactedPageImg = path.join(tmpDir, `redacted_page_${pageNum}.png`)
      drawBoxesOnImage(pageFile, redactedPageImg, allBboxes)
      redactedPageImages.push(redactedPageImg)
    }

    if (redactedPageImages.length > 0) {
      fs.copyFileSync(redactedPageImages[0]!, outPngPath)
    }

    compileMultiPagePdf(redactedPageImages, outPdfPath)

    return {
      totalPages,
      entitiesCount: totalEntitiesFound,
      bboxCount: totalBboxesFound,
      outPdfPath,
      outPngPath,
    }
  } finally {
    try {
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {}
  }
}

export async function redactDocumentFile(docPath: string, outPath: string) {
  const rawContent = fs.readFileSync(docPath, 'utf-8')
  const detection = await detectPII(rawContent, DEFAULT_PII_CONFIG)
  const masked = applyMasking(rawContent, detection.entities)
  fs.writeFileSync(outPath, masked, 'utf-8')
  return { entities: detection.entities, outPath }
}

export async function runRedactor(options: RedactOptions = {}) {
  const outputDir = options.outputDir || path.resolve(__dirname, '../dataset/redacted_outputs')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  console.log(`\n===============================================================`)
  console.log(` 🛡️  SECUREGPT DOCUMENT & IMAGE REDACTOR`)
  console.log(` Output Directory: ${outputDir}`)
  console.log(`===============================================================\n`)

  const pipeline = new OcrPipeline({ engine: new TesseractEngine() })
  await pipeline.initialize()

  try {
    if (options.inputPath) {
      const ext = path.extname(options.inputPath).toLowerCase()
      const baseName = path.parse(options.inputPath).name
      console.log(`Processing file: ${options.inputPath}`)

      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        const outPng = path.join(outputDir, `redacted_${baseName}.png`)
        const res = await redactImageFile(options.inputPath, outPng, pipeline)
        console.log(`✅ Saved: ${res.outputPath} (${res.entities.length} PII, ${res.bboxCount} boxes)`)
      } else if (ext === '.pdf') {
        const outPdf = path.join(outputDir, `redacted_${baseName}.pdf`)
        const outPng = path.join(outputDir, `redacted_${baseName}.png`)
        const res = await redactPdfFile(options.inputPath, outPdf, outPng, pipeline)
        console.log(`✅ Saved: ${res.outPdfPath} & ${res.outPngPath} (${res.entitiesCount} PII, ${res.totalPages} pages)`)
      } else {
        const outDoc = path.join(outputDir, `redacted_${path.basename(options.inputPath)}`)
        const res = await redactDocumentFile(options.inputPath, outDoc)
        console.log(`✅ Saved: ${res.outPath} (${res.entities.length} PII)`)
      }
      return
    }

    const doImages = options.redactImages ?? true
    const doPdfs = options.redactPdfs ?? true
    const doDocs = options.redactDocs ?? true

    if (doImages) {
      const imagesDir = path.resolve(__dirname, '../dataset/images')
      if (fs.existsSync(imagesDir)) {
        const imgFiles = fs.readdirSync(imagesDir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
        console.log(`\n--- 🖼️  REDACTING ${imgFiles.length} IMAGE SCANS ---`)
        for (const f of imgFiles) {
          const imgPath = path.join(imagesDir, f)
          const outPng = path.join(outputDir, `redacted_${path.parse(f).name}.png`)
          try {
            const res = await redactImageFile(imgPath, outPng, pipeline)
            console.log(`✅ [Image] ${f} -> ${path.basename(outPng)} (${res.entities.length} PII, ${res.bboxCount} boxes)`)
          } catch (err) {
            console.error(`❌ [Image] Failed ${f}:`, (err as Error).message)
          }
        }
      }
    }

    if (doPdfs) {
      const pdfsDir = path.resolve(__dirname, '../dataset/pdfs')
      if (fs.existsSync(pdfsDir)) {
        const pdfFiles = fs.readdirSync(pdfsDir).filter((f) => f.endsWith('.pdf'))
        console.log(`\n--- 📕 REDACTING ${pdfFiles.length} PDF DOCUMENTS ---`)
        for (const f of pdfFiles) {
          const pdfPath = path.join(pdfsDir, f)
          const baseName = path.parse(f).name
          const outPdf = path.join(outputDir, `redacted_${baseName}.pdf`)
          const outPng = path.join(outputDir, `redacted_${baseName}.png`)
          try {
            const res = await redactPdfFile(pdfPath, outPdf, outPng, pipeline)
            console.log(`✅ [PDF] ${f} (${res.totalPages} pages) -> ${path.basename(outPdf)} (${res.entitiesCount} PII, ${res.bboxCount} boxes)`)
          } catch (err) {
            console.error(`❌ [PDF] Failed ${f}:`, (err as Error).message)
          }
        }
      }
    }

    if (doDocs) {
      const piiExamplesDir = path.resolve(__dirname, '../dataset/pii-examples')
      if (fs.existsSync(piiExamplesDir)) {
        const docFiles = fs.readdirSync(piiExamplesDir).filter((f) => !/\.(png|jpg|jpeg|webp)$/i.test(f))
        console.log(`\n--- 📄 REDACTING ${docFiles.length} STRUCTURED / TEXT DOCS ---`)
        for (const f of docFiles) {
          const docPath = path.join(piiExamplesDir, f)
          if (fs.statSync(docPath).isDirectory()) continue
          const outDoc = path.join(outputDir, `redacted_${f}`)
          try {
            const res = await redactDocumentFile(docPath, outDoc)
            console.log(`✅ [Doc] ${f} -> ${path.basename(outDoc)} (${res.entities.length} PII masked)`)
          } catch (err) {
            console.warn(`⚠️ [Doc] Skipped ${f} (binary/unsupported text format)`)
          }
        }
      }
    }

    console.log(`\n===============================================================`)
    console.log(` 🎉 ALL REDACTIONS COMPLETED SUCCESSFULLY!`)
    console.log(` Saved to: ${outputDir}`)
    console.log(`===============================================================\n`)
  } finally {
    await pipeline.terminate()
  }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const inputArg = args.find((a) => a.startsWith('--input='))?.split('=')[1] || (args.includes('--input') ? args[args.indexOf('--input') + 1] : undefined)
  const outDirArg = args.find((a) => a.startsWith('--output-dir='))?.split('=')[1]

  const onlyImages = args.includes('--images')
  const onlyPdfs = args.includes('--pdfs')
  const onlyDocs = args.includes('--docs')

  runRedactor({
    ...(inputArg ? { inputPath: inputArg } : {}),
    ...(outDirArg ? { outputDir: outDirArg } : {}),
    redactImages: onlyImages ? true : (!onlyPdfs && !onlyDocs),
    redactPdfs: onlyPdfs ? true : (!onlyImages && !onlyDocs),
    redactDocs: onlyDocs ? true : (!onlyImages && !onlyPdfs),
  }).catch(console.error)
}
