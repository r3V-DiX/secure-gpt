import { DOMAIN_TO_PLATFORM, type LLMPlatform } from '@securegpt/shared/constants'
import type { PIIConfig } from '@securegpt/shared/types'

export function getPlatformForUrl(url: string): LLMPlatform | null {
  const parsed = new URL(url)
  const platform = DOMAIN_TO_PLATFORM[parsed.hostname]
  if (!platform) return null
  if (platform !== 'google-ai-mode') return platform

  const path = parsed.pathname.replace(/\/$/, '')
  if (path === '/ai' || path === '/aimode') return platform
  if (path === '/search' && parsed.searchParams.get('udm') === '50') return platform
  return null
}

export function isPlatformEnabled(policy: PIIConfig, platform: LLMPlatform): boolean {
  return policy.monitoredPlatforms.includes(platform)
}
