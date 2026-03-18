// ─────────────────────────────────────────────
// Allowlist Utils
// Filter out entities the org has allowlisted
// ─────────────────────────────────────────────

import type { PIIEntity } from '@securegpt/shared/types'
import type { PIIConfig } from '@securegpt/shared/types'
import type { PIICategory } from '@securegpt/shared/constants'

export function applyAllowlist(
  entities: PIIEntity[],
  config: PIIConfig
): PIIEntity[] {
  return entities.filter((entity) => {
    const categoryConfig = config.categories[entity.category as PIICategory]
    if (!categoryConfig?.allowlist?.length) return true

    return !categoryConfig.allowlist.some((allowedPattern) =>
      entity.value.toLowerCase().includes(allowedPattern.toLowerCase())
    )
  })
}
