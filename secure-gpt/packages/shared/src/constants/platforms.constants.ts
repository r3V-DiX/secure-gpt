// ─────────────────────────────────────────────
// Supported LLM Platforms
// ─────────────────────────────────────────────

export const LLM_PLATFORMS = {
  chatgpt: 'chatgpt',
  gemini: 'gemini',
  'google-ai-mode': 'google-ai-mode',
  copilot: 'copilot',
  claude: 'claude',
  perplexity: 'perplexity',
  'meta-ai': 'meta-ai',
  poe: 'poe',
  mistral: 'mistral',
  cursor: 'cursor',
  v0: 'v0',
  replit: 'replit',
  huggingchat: 'huggingchat',
  deepseek: 'deepseek',
} as const

export type LLMPlatform = keyof typeof LLM_PLATFORMS

export const PLATFORM_LABELS: Record<LLMPlatform, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Google Gemini',
  'google-ai-mode': 'Google AI Mode',
  copilot: 'Microsoft Copilot',
  claude: 'Claude (Anthropic)',
  perplexity: 'Perplexity AI',
  'meta-ai': 'Meta AI',
  poe: 'Poe',
  mistral: 'Mistral Le Chat',
  cursor: 'Cursor Web',
  v0: 'v0 (Vercel)',
  replit: 'Replit Agent',
  huggingchat: 'HuggingChat',
  deepseek: 'DeepSeek',
}

export const PLATFORM_DOMAINS: Record<LLMPlatform, string | string[]> = {
  chatgpt: ['chat.openai.com', 'chatgpt.com'],
  gemini: 'gemini.google.com',
  'google-ai-mode': ['google.com', 'www.google.com'],
  copilot: ['copilot.microsoft.com', 'copilot.com', 'www.copilot.com'],
  claude: 'claude.ai',
  perplexity: ['perplexity.ai', 'www.perplexity.ai'],
  'meta-ai': ['meta.ai', 'www.meta.ai'],
  poe: 'poe.com',
  mistral: ['chat.mistral.ai', 'mistral.ai'],
  cursor: ['cursor.com', 'cursor.sh'],
  v0: ['v0.dev', 'v0.app', 'www.v0.app'],
  replit: 'replit.com',
  huggingchat: 'huggingface.co',
  deepseek: ['chat.deepseek.com', 'deepseek.com'],
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
