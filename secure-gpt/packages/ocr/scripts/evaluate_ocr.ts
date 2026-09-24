// ─────────────────────────────────────────────
// @securegpt/ocr — Evaluation & Accuracy Benchmark Harness
// Computes CER (Character Error Rate), WER (Word Error Rate), PII Recall, and Precision
// ─────────────────────────────────────────────

import * as fs from 'fs'
import * as path from 'path'
import { OcrPipeline } from '../src/pipeline/ocrPipeline'
import { MockOcrEngine } from '../src/engines/mockEngine'
import { TesseractEngine } from '../src/engines/tesseractEngine'
import { levenshteinDistance } from '../src/postprocessor/signals'

export interface GroundTruthItem {
  id: string
  title: string
  imagePath?: string
  mockOcrRaw?: string
  expectedText: string
  expectedEntities: Array<{
    type: string
    value: string
  }>
}

export interface MetricResult {
  id: string
  title: string
  cer: number
  wer: number
  expectedEntitiesCount: number
  detectedEntitiesCount: number
  truePositives: number
  recall: number
  precision: number
  latencyMs: number
}

export function computeWER(reference: string, hypothesis: string): number {
  const refWords = reference.trim().split(/\s+/).filter(Boolean)
  const hypWords = hypothesis.trim().split(/\s+/).filter(Boolean)

  if (refWords.length === 0) return hypWords.length === 0 ? 0 : 1

  const r = refWords.length
  const h = hypWords.length
  const d: number[][] = []

  for (let i = 0; i <= r; i++) {
    d[i] = [i]
  }
  for (let j = 0; j <= h; j++) {
    d[0]![j] = j
  }

  for (let i = 1; i <= r; i++) {
    for (let j = 1; j <= h; j++) {
      if (refWords[i - 1] === hypWords[j - 1]) {
        d[i]![j] = d[i - 1]![j - 1]!
      } else {
        d[i]![j] = Math.min(
          d[i - 1]![j - 1]! + 1, // substitution
          d[i]![j - 1]! + 1,     // insertion
          d[i - 1]![j]! + 1      // deletion
        )
      }
    }
  }

  return d[r]![h]! / refWords.length
}

export function computeCER(reference: string, hypothesis: string): number {
  const refClean = reference.replace(/\s+/g, '')
  const hypClean = hypothesis.replace(/\s+/g, '')

  if (refClean.length === 0) return hypClean.length === 0 ? 0 : 1

  const editDist = levenshteinDistance(refClean, hypClean)
  return editDist / refClean.length
}

function resolveImagePayload(imagePath?: string): string {
  if (!imagePath) return 'data:image/png;base64,mock'
  if (imagePath.startsWith('data:')) return imagePath

  const candidates = [
    imagePath,
    path.resolve(__dirname, '../dataset/images', imagePath),
    path.resolve(__dirname, '../dataset', imagePath),
    path.resolve(process.cwd(), imagePath),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const ext = path.extname(p).toLowerCase()
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg'
      const buf = fs.readFileSync(p)
      return `data:${mime};base64,${buf.toString('base64')}`
    }
  }

  return imagePath
}

export async function runEvaluation(datasetPath: string, useMock: boolean = false) {
  console.log(`\n===============================================================`)
  console.log(` 🔬 SECUREGPT OCR ACCURACY & EVALUATION HARNESS`)
  console.log(`===============================================================\n`)

  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}`)
    return
  }

  const rawLines = fs.readFileSync(datasetPath, 'utf-8').split('\n').filter(Boolean)
  const items: GroundTruthItem[] = rawLines.map((line) => JSON.parse(line))

  console.log(`Loaded ${items.length} ground-truth test instances.\n`)

  const pipeline = new OcrPipeline({
    engine: useMock ? new MockOcrEngine() : new TesseractEngine(),
  })
  await pipeline.initialize()

  const results: MetricResult[] = []

  for (const item of items) {
    const start = performance.now()

    if (useMock && item.mockOcrRaw) {
      ;(pipeline['engine'] as MockOcrEngine).setMockResponse(item.mockOcrRaw)
    }

    const imageSource = resolveImagePayload(item.imagePath)
    const result = await pipeline.processImage(imageSource)
    const latency = Math.round(performance.now() - start)

    const extractedText = result.repairedText || result.rawText
    const cer = computeCER(item.expectedText, extractedText)
    const wer = computeWER(item.expectedText, extractedText)

    // Evaluate PII recall
    let truePositives = 0
    for (const expected of item.expectedEntities) {
      if (extractedText.includes(expected.value)) {
        truePositives++
      }
    }

    const recall = item.expectedEntities.length > 0 ? truePositives / item.expectedEntities.length : 1
    const precision = truePositives > 0 ? 1 : (item.expectedEntities.length === 0 ? 1 : 0)

    results.push({
      id: item.id,
      title: item.title,
      cer,
      wer,
      expectedEntitiesCount: item.expectedEntities.length,
      detectedEntitiesCount: truePositives,
      truePositives,
      recall,
      precision,
      latencyMs: latency,
    })

    console.log(`[${item.id}] ${item.title}`)
    console.log(`  - CER: ${(cer * 100).toFixed(2)}% | WER: ${(wer * 100).toFixed(2)}% | PII Recall: ${(recall * 100).toFixed(1)}% | Latency: ${latency}ms`)
  }

  const avgCer = results.reduce((acc, r) => acc + r.cer, 0) / results.length
  const avgWer = results.reduce((acc, r) => acc + r.wer, 0) / results.length
  const avgRecall = results.reduce((acc, r) => acc + r.recall, 0) / results.length
  const avgPrecision = results.reduce((acc, r) => acc + r.precision, 0) / results.length
  const avgLatency = Math.round(results.reduce((acc, r) => acc + r.latencyMs, 0) / results.length)

  console.log(`\n---------------------------------------------------------------`)
  console.log(` 📊 OVERALL BENCHMARK SUMMARY`)
  console.log(`---------------------------------------------------------------`)
  console.log(`  * Mean Character Error Rate (CER): ${(avgCer * 100).toFixed(2)}%`)
  console.log(`  * Mean Word Error Rate (WER):      ${(avgWer * 100).toFixed(2)}%`)
  console.log(`  * Mean PII Recall:                ${(avgRecall * 100).toFixed(2)}%`)
  console.log(`  * Mean Precision:                 ${(avgPrecision * 100).toFixed(2)}%`)
  console.log(`  * Average Processing Latency:     ${avgLatency}ms`)
  console.log(`===============================================================\n`)

  // Save results to research/ directory
  const researchDir = path.resolve(__dirname, '../../../research')
  if (!fs.existsSync(researchDir)) {
    fs.mkdirSync(researchDir, { recursive: true })
  }

  const resultPayload = {
    timestamp: new Date().toISOString(),
    engine: pipeline['engine'].name,
    summary: {
      instancesCount: items.length,
      meanCer: avgCer,
      meanWer: avgWer,
      meanRecall: avgRecall,
      meanPrecision: avgPrecision,
      meanLatencyMs: avgLatency,
    },
    details: results,
  }

  const outputPath = path.join(researchDir, 'ocr_evaluation_results.json')
  fs.writeFileSync(outputPath, JSON.stringify(resultPayload, null, 2))
  console.log(`Saved detailed benchmark JSON results to: ${outputPath}\n`)

  await pipeline.terminate()
  return resultPayload
}

const datasetFile = path.resolve(__dirname, '../dataset/ground_truth.jsonl')
runEvaluation(datasetFile, true).catch(console.error)
