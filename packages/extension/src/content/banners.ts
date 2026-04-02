// ─────────────────────────────────────────────
// Banners
// In-page notification banners injected into LLM pages
// ─────────────────────────────────────────────

import { injectBanner, removeAllBanners } from './dom-utils'
import type { PIICategory } from '@securegpt/shared/constants'
import { PII_CATEGORY_LABELS } from '@securegpt/shared/constants'

type BannerType = 'block' | 'mask' | 'warn' | 'allow' | 'loading'

const BANNER_STYLES: Record<BannerType, { bg: string; border: string; icon: string }> = {
  block: { bg: '#fff5f5', border: '#D32F2F', icon: '🚫' },
  mask: { bg: '#fffbf0', border: '#F57C00', icon: '⚠️' },
  warn: { bg: '#fff8f0', border: '#E65100', icon: '⚠️' },
  allow: { bg: '#f0f8ff', border: '#1565C0', icon: 'ℹ️' },
  loading: { bg: '#f8f9fa', border: '#78909c', icon: '⏳' },
}

const BANNER_MESSAGES: Record<BannerType, (category: string, count: number) => string> = {
  block: (cat, n) => `Submission blocked: ${cat} data detected (${n} item${n > 1 ? 's' : ''}). This has been logged.`,
  mask: (_cat, n) => `Sensitive data detected and masked before sending. ${n} item${n > 1 ? 's' : ''} redacted.`,
  warn: (cat, n) => `Warning: Potentially sensitive ${cat} content detected (${n} item${n > 1 ? 's' : ''}).`,
  allow: (_cat, _n) => `Data monitored and logged per company policy.`,
  loading: (_cat, _n) => `Scanning image for sensitive context... Please wait.`,
}

let activeBanner: HTMLElement | null = null
let acknowledgeCallback: ((proceed: boolean) => void) | null = null

export function showBanner(
  type: BannerType,
  category: PIICategory,
  matchCount: number,
  onAcknowledge?: (proceed: boolean) => void
): void {
  removeBanner()

  const style = BANNER_STYLES[type]
  const categoryLabel = PII_CATEGORY_LABELS[category] ?? category
  const message = BANNER_MESSAGES[type](categoryLabel, matchCount)

  const banner = document.createElement('div')
  banner.setAttribute('data-securegpt-banner', type)
  banner.setAttribute('data-securegpt', 'true')

  banner.style.cssText = `
    position: relative;
    width: 100%;
    padding: 12px 16px;
    background: ${style.bg};
    border-left: 4px solid ${style.border};
    border-radius: 6px;
    margin-bottom: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    animation: securegpt-slide-in 0.2s ease-out;
  `

  // Add slide-in animation
  if (!document.querySelector('#securegpt-styles')) {
    const styleEl = document.createElement('style')
    styleEl.id = 'securegpt-styles'
    styleEl.textContent = `
      @keyframes securegpt-slide-in {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(styleEl)
  }

  const leftSection = document.createElement('div')
  leftSection.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;'
  leftSection.innerHTML = `
    <span style="font-size: 16px;">${style.icon}</span>
    <span><strong style="color: ${style.border};">SecureGPT</strong> — ${message}</span>
  `

  const rightSection = document.createElement('div')
  rightSection.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-shrink: 0;'

  // Warn+Allow gets acknowledge + cancel buttons
  if (type === 'warn' && onAcknowledge) {
    acknowledgeCallback = onAcknowledge

    const ackBtn = document.createElement('button')
    ackBtn.textContent = 'Acknowledge & Send'
    ackBtn.style.cssText = `
      padding: 5px 12px; background: ${style.border}; color: white;
      border: none; border-radius: 4px; cursor: pointer; font-size: 12px;
      font-weight: 500;
    `
    ackBtn.addEventListener('click', () => {
      acknowledgeCallback?.(true)
      removeBanner()
    })

    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.style.cssText = `
      padding: 5px 12px; background: transparent; color: #666;
      border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 12px;
    `
    cancelBtn.addEventListener('click', () => {
      acknowledgeCallback?.(false)
      removeBanner()
    })

    rightSection.appendChild(ackBtn)
    rightSection.appendChild(cancelBtn)
  }

  // Dismiss button for all banners
  const dismissBtn = document.createElement('button')
  dismissBtn.textContent = '✕'
  dismissBtn.style.cssText = `
    padding: 2px 6px; background: transparent; color: #999;
    border: none; cursor: pointer; font-size: 14px;
  `
  dismissBtn.addEventListener('click', () => removeBanner())
  rightSection.appendChild(dismissBtn)

  banner.appendChild(leftSection)
  banner.appendChild(rightSection)

  activeBanner = banner
  injectBanner(banner)

  // Auto-dismiss allow banners after 4 seconds
  if (type === 'allow') {
    setTimeout(() => removeBanner(), 4000)
  }
}

export function removeBanner(): void {
  removeAllBanners()
  activeBanner = null
  acknowledgeCallback = null
}
