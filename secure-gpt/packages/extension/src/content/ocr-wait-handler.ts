// packages/extension/src/content/ocr-wait-handler.ts
// Handles async waiting for in-flight OCR/PDF extractions with timeout safeguard

export async function waitForPendingOcr(
  getPendingCount: () => number,
  maxWaitMs = 20000,
  pollIntervalMs = 50
): Promise<boolean> {
  const startTime = Date.now()
  while (getPendingCount() > 0) {
    if (Date.now() - startTime >= maxWaitMs) {
      console.warn(`[SecureGPT] OCR wait timed out after ${maxWaitMs}ms, proceeding with available results`)
      return false
    }
    await new Promise((r) => setTimeout(r, pollIntervalMs))
  }
  return true
}
