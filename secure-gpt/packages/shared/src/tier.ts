// ─────────────────────────────────────────────
// Base Tier — Abstract class all tiers extend
// ─────────────────────────────────────────────

import type { PIIEntity } from './types'
import type { PIIConfig } from './types'
import type { DetectionTier } from './types'

export abstract class BaseTier {
  abstract readonly name: DetectionTier
  abstract readonly enabled: boolean

  abstract run(
    text: string,
    config: PIIConfig
  ): Promise<PIIEntity[]>

  // Optional: called once when extension loads
  // Override in tiers that need async setup (e.g. loading ONNX model)
  async initialize(): Promise<void> {
    // no-op by default
  }

  // Optional: cleanup when tier is disabled
  async teardown(): Promise<void> {
    // no-op by default
  }
}
