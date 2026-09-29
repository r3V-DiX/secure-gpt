import { detectPII } from '@securegpt/detection'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'

declare global {
  interface Window {
    runDetectionSample: (text: string) => Promise<unknown>
  }
}

window.runDetectionSample = async (text: string) => {
  const result = await detectPII(text, DEFAULT_PII_CONFIG)
  return result.entities
}
