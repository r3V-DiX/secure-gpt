// ─────────────────────────────────────────────
// Banners
// In-page notification banners injected into LLM pages
// ─────────────────────────────────────────────

import { injectBanner, removeAllBanners } from './dom-utils'
import type { PIICategory } from '@securegpt/shared/constants'
import { PII_CATEGORY_LABELS } from '@securegpt/shared/constants'

type BannerType = 'block' | 'mask' | 'warn' | 'allow' | 'loading' | 'loading_pdf'

const BANNER_STYLES: Record<BannerType, { bg: string; border: string; icon: string }> = {
  block: {
    bg: '#fef2f2',
    border: '#dc2626',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>',
  },
  mask: {
    bg: '#fffbeb',
    border: '#d97706',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/></svg>',
  },
  warn: {
    bg: '#fffbeb',
    border: '#d97706',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
  },
  allow: {
    bg: '#eff6ff',
    border: '#2563eb',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  },
  loading: {
    bg: '#f8fafc',
    border: '#64748b',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-animation"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  },
  loading_pdf: {
    bg: '#f8fafc',
    border: '#64748b',
    icon: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin-animation"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  },
}

const BANNER_MESSAGES: Record<BannerType, (category: string, count: number) => string> = {
  block: (cat, n) => `Submission blocked: ${cat} data detected (${n} item${n > 1 ? 's' : ''}). This has been logged.`,
  mask: (_cat, n) => `Sensitive data detected and masked before sending. ${n} item${n > 1 ? 's' : ''} redacted.`,
  warn: (cat, n) => `Warning: Potentially sensitive ${cat} content detected (${n} item${n > 1 ? 's' : ''}).`,
  allow: (_cat, _n) => `Data monitored and logged per company policy.`,
  loading: (_cat, _n) => `Scanning image for sensitive context... Please wait.`,
  loading_pdf: (_cat, _n) => `Scanning and redacting PDF document... Please wait.`,
}

let acknowledgeCallback: ((proceed: boolean) => void) | null = null

export function showBanner(
  type: BannerType,
  category: PIICategory,
  matchCount: number,
  onAcknowledge?: (proceed: boolean) => void,
  onClick?: () => void
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
    padding: 10px 14px;
    background: ${style.bg};
    border-left: 3px solid ${style.border};
    border-radius: 6px;
    margin-bottom: 8px;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12.5px;
    color: #0f172a;
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
  const clickCue = onClick ? ' <span style="font-size: 11px; opacity: 0.6; text-decoration: underline;">(click to view findings)</span>' : ''
  leftSection.innerHTML = `
    <span style="font-size: 16px;">${style.icon}</span>
    <span><strong style="color: ${style.border};">SecureGPT</strong> — ${message}${clickCue}</span>
  `

  if (onClick) {
    leftSection.style.cursor = 'pointer'
    leftSection.addEventListener('click', onClick)
    leftSection.style.transition = 'opacity 0.15s ease'
    leftSection.addEventListener('mouseenter', () => { leftSection.style.opacity = '0.85' })
    leftSection.addEventListener('mouseleave', () => { leftSection.style.opacity = '1' })
  }

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

  injectBanner(banner)

  // Auto-dismiss allow banners after 4 seconds
  if (type === 'allow') {
    setTimeout(() => removeBanner(), 4000)
  }
}

export function removeBanner(): void {
  removeAllBanners()
  acknowledgeCallback = null
}
