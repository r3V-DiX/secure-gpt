import { describe, expect, it, vi } from 'vitest'
const worker = vi.hoisted(() => ({ setParameters: vi.fn(async () => undefined), recognize: vi.fn(), terminate: vi.fn(async () => undefined) }))
vi.mock('tesseract.js', () => ({ createWorker: vi.fn(async () => worker), PSM: { AUTO: 3 } }))
vi.mock('../src/engines/nativeTesseractHelper', () => ({ getNodeModules: () => null }))
import { createWorker } from 'tesseract.js'
import { TesseractEngine } from '../src/engines/tesseractEngine'

describe('OCR failure propagation and serialization', () => {
  it('propagates worker initialization failure', async () => {
    vi.mocked(createWorker).mockRejectedValueOnce(new Error('missing asset'))
    await expect(new TesseractEngine().recognize('image')).rejects.toThrow('OCR_INITIALIZATION_FAILED')
  })
  it('propagates recognition failure rather than producing empty clean text', async () => {
    worker.recognize.mockRejectedValueOnce(new Error('worker crashed'))
    await expect(new TesseractEngine().recognize('image')).rejects.toThrow('OCR_RECOGNITION_FAILED')
  })
  it('serializes parameter changes and recognition', async () => {
    let release!: (value: unknown) => void
    const response = { data: { text: 'synthetic text', confidence: 90, words: [] } }
    worker.recognize.mockClear().mockImplementationOnce(() => new Promise(resolve => { release = resolve })).mockResolvedValue(response)
    const engine = new TesseractEngine()
    const first = engine.recognize('one', { psm: 11 })
    const second = engine.recognize('two', { psm: 3 })
    await vi.waitFor(() => expect(worker.recognize).toHaveBeenCalledOnce())
    release(response)
    await Promise.all([first, second])
    expect(worker.recognize).toHaveBeenCalledTimes(2)
  })
  it('cancellation terminates hung recognition and releases the queue', async () => {
    worker.recognize.mockClear().mockImplementationOnce(() => new Promise(() => undefined)).mockResolvedValue({ data: { text: 'safe', confidence: 90, words: [] } })
    const engine = new TesseractEngine()
    const controller = new AbortController()
    const pending = engine.recognize('one', { signal: controller.signal })
    const assertion = expect(pending).rejects.toThrow('OCR_RECOGNITION_FAILED')
    await vi.waitFor(() => expect(worker.recognize).toHaveBeenCalledOnce())
    controller.abort()
    await assertion
    await expect(engine.recognize('two')).resolves.toHaveProperty('text', 'safe')
  })
  it('cancellation releases the queue even when worker initialization hangs', async () => {
    vi.mocked(createWorker).mockImplementationOnce(() => new Promise(() => undefined))
    const engine = new TesseractEngine()
    const controller = new AbortController()
    const pending = engine.recognize('one', { signal: controller.signal })
    const assertion = expect(pending).rejects.toThrow('OCR_RECOGNITION_FAILED')
    await new Promise(resolve => setTimeout(resolve, 0))
    controller.abort()
    await assertion
    worker.recognize.mockResolvedValue({ data: { text: 'safe', confidence: 90, words: [] } })
    await expect(engine.recognize('two')).resolves.toHaveProperty('text', 'safe')
  })
})
