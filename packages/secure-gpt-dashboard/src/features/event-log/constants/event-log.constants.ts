// packages/dashboard/src/features/event-log/constants/event-log.constants.ts

export const ACTION_OPTIONS = ['BLOCK', 'MASK', 'WARN_ALLOW', 'ALLOW'] as const
export const CATEGORY_OPTIONS = ['FINANCIAL', 'PII', 'CONFIDENTIAL', 'IP'] as const
export const PLATFORM_OPTIONS = ['chatgpt', 'gemini', 'copilot', 'claude', 'perplexity', 'meta-ai'] as const

export const ACTION_LABELS: Record<string, string> = {
    BLOCK: 'Block',
    MASK: 'Mask',
    WARN_ALLOW: 'Warn',
    ALLOW: 'Allow',
}

export const DEFAULT_PAGE_SIZE = 20