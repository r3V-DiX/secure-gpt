// packages/extension/src/content/site-detection-indicator.ts
import { DOMAIN_TO_PLATFORM, PLATFORM_LABELS, type LLMPlatform } from '@securegpt/shared/constants'
import { INDICATOR_TEMPLATE, WELCOME_MODAL_TEMPLATE } from './site-indicator-templates'

let indicatorHostEl: HTMLElement | null = null
let isFlyoutOpen = false

export function getCurrentPlatform(): { id: LLMPlatform | 'unknown'; label: string; domain: string } {
  const hostname = window.location.hostname
  const matchingDomain = Object.keys(DOMAIN_TO_PLATFORM).find(d => hostname.endsWith(d))
  const platformId: LLMPlatform | 'unknown' = DOMAIN_TO_PLATFORM[hostname] || (matchingDomain ? DOMAIN_TO_PLATFORM[matchingDomain] : 'unknown') || 'unknown'
  const label = platformId !== 'unknown' ? (PLATFORM_LABELS[platformId as LLMPlatform] || 'AI Platform') : 'AI Platform'
  return { id: platformId, label, domain: hostname }
}

export function initSiteDetectionIndicator(_policy?: any): void {
  const platform = getCurrentPlatform()
  if (platform.id === 'unknown' && !window.location.hostname.includes('chat') && !window.location.hostname.includes('ai')) {
    return
  }

  // Remove existing indicator if any
  removeSiteDetectionIndicator()

  // 1. Mount Persistent Floating Bottom-Right Indicator
  mountBottomRightIndicator(platform)

  // 2. Check if initial welcome modal should be shown
  checkAndShowWelcomeModal(platform)
}

function mountBottomRightIndicator(
  platform: { id: LLMPlatform | 'unknown'; label: string; domain: string }
): void {
  const host = document.createElement('div')
  host.id = 'securegpt-site-indicator-host'
  host.setAttribute('data-securegpt', 'true')
  host.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 2147483630; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = INDICATOR_TEMPLATE(platform.label)

  document.body.appendChild(host)
  indicatorHostEl = host

  const pill = shadow.getElementById('indicator-pill')
  const flyout = shadow.getElementById('flyout-menu')
  const closeBtn = shadow.getElementById('flyout-close-btn')
  const guideBtn = shadow.getElementById('open-guide-btn')

  const toggleFlyout = (open?: boolean) => {
    isFlyoutOpen = open !== undefined ? open : !isFlyoutOpen
    if (flyout) {
      if (isFlyoutOpen) flyout.classList.add('visible')
      else flyout.classList.remove('visible')
    }
  }

  pill?.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleFlyout()
  })

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleFlyout(false)
  })

  guideBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleFlyout(false)
    showWelcomeModal(platform, true)
  })

  window.addEventListener('click', (e) => {
    if (isFlyoutOpen && !host.contains(e.target as Node)) {
      toggleFlyout(false)
    }
  })
}

function checkAndShowWelcomeModal(platform: { id: LLMPlatform | 'unknown'; label: string; domain: string }): void {
  try {
    const key = `securegpt_suppress_welcome_${platform.id}`
    const suppressedUntil = localStorage.getItem(key)
    if (suppressedUntil && Number(suppressedUntil) > Date.now()) {
      return
    }
    showWelcomeModal(platform, false)
  } catch {
    // LocalStorage fallback
  }
}

export function showWelcomeModal(
  platform: { id: LLMPlatform | 'unknown'; label: string; domain: string },
  forced = false
): void {
  const existingModal = document.getElementById('securegpt-welcome-modal-host')
  if (existingModal) existingModal.remove()
  if (forced) {
    try {
      localStorage.removeItem(`securegpt_suppress_welcome_${platform.id}`)
    } catch {
      // ignore
    }
  }

  const host = document.createElement('div')
  host.id = 'securegpt-welcome-modal-host'
  host.setAttribute('data-securegpt', 'true')
  host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483646;'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = WELCOME_MODAL_TEMPLATE(platform.label)

  document.body.appendChild(host)

  const backdrop = shadow.getElementById('modal-backdrop')
  const closeBtn = shadow.getElementById('modal-close-btn')
  const understoodBtn = shadow.getElementById('btn-understood')
  const suppressCheckbox = shadow.getElementById('suppress-checkbox') as HTMLInputElement | null

  const closeModal = () => {
    if (suppressCheckbox?.checked) {
      try {
        const key = `securegpt_suppress_welcome_${platform.id}`
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
        localStorage.setItem(key, String(Date.now() + sevenDaysMs))
      } catch {
        // Storage fallback
      }
    }
    host.remove()
  }

  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal()
  })
  closeBtn?.addEventListener('click', closeModal)
  understoodBtn?.addEventListener('click', closeModal)
}

export function removeSiteDetectionIndicator(): void {
  if (indicatorHostEl) {
    indicatorHostEl.remove()
    indicatorHostEl = null
  }
}
