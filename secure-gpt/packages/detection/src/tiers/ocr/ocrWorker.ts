// ─────────────────────────────────────────────
// Backward Compatibility Shim -> @securegpt/ocr/engines
// ─────────────────────────────────────────────

import { TesseractEngine } from '@securegpt/ocr'

let defaultEngine: TesseractEngine | null = null

export async function getOcrWorker(): Promise<any> {
  if (!defaultEngine) {
    defaultEngine = new TesseractEngine()
  }
  if (!defaultEngine.isReady) {
    await defaultEngine.initialize()
  }
  return {
    recognize: (url: string, _rect?: any, opts?: any) => defaultEngine!.recognize(url, opts),
    setParameters: (params: any) => defaultEngine!.setParameters(params),
    terminate: () => defaultEngine?.terminate(),
  }
}

export function resetOcrWorker(): void {
  if (defaultEngine) {
    defaultEngine.terminate()
    defaultEngine = null
  }
}
