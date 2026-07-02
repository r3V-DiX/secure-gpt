// ─────────────────────────────────────────────
// Supported LLM Platforms
// ─────────────────────────────────────────────

export const LLM_PLATFORMS = {
  chatgpt: 'chatgpt',
  gemini: 'gemini',
  copilot: 'copilot',
  claude: 'claude',
  perplexity: 'perplexity',
  'meta-ai': 'meta-ai',
} as const

export type LLMPlatform = keyof typeof LLM_PLATFORMS

export const PLATFORM_LABELS: Record<LLMPlatform, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Google Gemini',
  copilot: 'Microsoft Copilot',
  claude: 'Claude (Anthropic)',
  perplexity: 'Perplexity AI',
  'meta-ai': 'Meta AI',
}

export const PLATFORM_DOMAINS: Record<LLMPlatform, string | string[]> = {
  chatgpt: ['chat.openai.com', 'chatgpt.com'],
  gemini: 'gemini.google.com',
  copilot: 'copilot.microsoft.com',
  claude: 'claude.ai',
  perplexity: 'perplexity.ai',
  'meta-ai': 'meta.ai',
}

// Reverse lookup: domain -> platform
export const DOMAIN_TO_PLATFORM: Record<string, LLMPlatform> = Object.entries(
  PLATFORM_DOMAINS
).reduce(
  (acc, [platform, domain]) => {
    if (Array.isArray(domain)) {
      domain.forEach(d => {
        acc[d] = platform as LLMPlatform
      })
    } else {
      acc[domain] = platform as LLMPlatform
    }
    return acc
  },
  {} as Record<string, LLMPlatform>
)

export const ALL_PLATFORMS = Object.keys(LLM_PLATFORMS) as LLMPlatform[]
