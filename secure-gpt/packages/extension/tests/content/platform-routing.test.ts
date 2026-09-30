import { describe, expect, it } from 'vitest'
import { DEFAULT_PII_CONFIG } from '@securegpt/shared/types'
import { PLATFORM_DOMAINS } from '@securegpt/shared/constants'
import { getPlatformForUrl, isPlatformEnabled } from '../../src/content/platform-routing'
import manifest from '../../public/manifest.json'

describe('platform routing', () => {
  it('activates Google AI Mode routes while leaving ordinary Search alone', () => {
    expect(getPlatformForUrl('https://www.google.com/ai')).toBe('google-ai-mode')
    expect(getPlatformForUrl('https://google.com/aimode/')).toBe('google-ai-mode')
    expect(getPlatformForUrl('https://www.google.com/search?q=hello&udm=50')).toBe('google-ai-mode')
    expect(getPlatformForUrl('https://www.google.com/search?q=hello')).toBeNull()
    expect(getPlatformForUrl('https://www.google.com/')).toBeNull()
    expect(getPlatformForUrl('https://gemini.google.com/app')).toBe('gemini')
  })

  it('keeps AI Mode independent of Gemini in policy', () => {
    const geminiOnly = { ...DEFAULT_PII_CONFIG, monitoredPlatforms: ['gemini'] as typeof DEFAULT_PII_CONFIG.monitoredPlatforms }
    expect(isPlatformEnabled(geminiOnly, 'google-ai-mode')).toBe(false)
    expect(isPlatformEnabled(geminiOnly, 'gemini')).toBe(true)
  })

  it('covers every registered hostname in the manifest', () => {
    const matches = manifest.content_scripts[0]!.matches
    const permissions = manifest.host_permissions
    for (const [platform, domains] of Object.entries(PLATFORM_DOMAINS)) {
      for (const domain of [domains].flat()) {
        const path = platform === 'google-ai-mode' ? '/ai' : platform === 'huggingchat' ? '/chat/' : '/'
        const url = `https://${domain}${path}`
        const covered = (pattern: string) => {
          const hostname = new URL(pattern.replace('*.', 'subdomain.').replace('/*', '/')).hostname
          if (pattern.includes('*.')) {
            const base = hostname.slice('subdomain.'.length)
            return domain === base || domain.endsWith(`.${base}`)
          }
          return hostname === domain
        }
        expect(matches.some(covered), `${url} missing content script`).toBe(true)
        expect(permissions.some(covered), `${url} missing host permission`).toBe(true)
        expect(getPlatformForUrl(url), `${url} failed runtime routing`).toBe(platform)
      }
    }
  })

  it('does not route retired platforms', () => {
    for (const host of ['www.phind.com', 'www.notion.so', 'app.jasper.ai', 'app.copy.ai']) {
      expect(getPlatformForUrl(`https://${host}/`)).toBeNull()
    }
  })
})
