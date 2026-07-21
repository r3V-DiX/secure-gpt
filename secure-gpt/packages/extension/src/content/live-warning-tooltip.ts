// packages/extension/src/content/live-warning-tooltip.ts

import type { PIIEntity } from '@securegpt/shared/types'

let tooltipEl: HTMLElement | null = null

function injectTooltipStyles() {
  if (document.querySelector('#securegpt-live-tooltip-styles')) return

  const styleEl = document.createElement('style')
  styleEl.id = 'securegpt-live-tooltip-styles'
  styleEl.textContent = `
    #securegpt-live-tooltip {
      position: absolute;
      z-index: 2147483647;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      min-width: 280px;
      animation: securegpt-tooltip-fade 0.2s ease-out;
    }
    @keyframes securegpt-tooltip-fade {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .securegpt-tooltip-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .securegpt-tooltip-icon {
      color: #ef4444;
      display: flex;
    }
    .securegpt-tooltip-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .securegpt-tooltip-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .securegpt-tooltip-btn {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: background-color 0.15s ease;
    }
    .securegpt-btn-mask {
      background: #ef4444;
      color: white;
    }
    .securegpt-btn-mask:hover {
      background: #dc2626;
    }
    .securegpt-btn-allow {
      background: #f1f5f9;
      color: #475569;
    }
    .securegpt-btn-allow:hover {
      background: #e2e8f0;
    }
  `
  document.head.appendChild(styleEl)
}

export function showLiveWarningTooltip(
  entities: PIIEntity[],
  targetEl: HTMLElement,
  onMaskNow: () => void,
  onAllow: (() => void) | undefined
) {
  removeLiveWarningTooltip()
  injectTooltipStyles()

  const tooltip = document.createElement('div')
  tooltip.id = 'securegpt-live-tooltip'
  
  // Title / Icon
  const header = document.createElement('div')
  header.className = 'securegpt-tooltip-header'
  
  const icon = document.createElement('span')
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  `
  icon.className = 'securegpt-tooltip-icon'
  
  const text = document.createElement('span')
  text.className = 'securegpt-tooltip-title'
  text.innerText = `Warning: ${entities.length} sensitive ${entities.length === 1 ? 'item' : 'items'} detected`
  
  header.appendChild(icon)
  header.appendChild(text)
  tooltip.appendChild(header)

  // Actions
  const actions = document.createElement('div')
  actions.className = 'securegpt-tooltip-actions'

  const maskBtn = document.createElement('button')
  maskBtn.className = 'securegpt-tooltip-btn securegpt-btn-mask'
  maskBtn.innerText = 'Mask Now'
  maskBtn.onclick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onMaskNow()
  }
  actions.appendChild(maskBtn)

  if (onAllow) {
    const allowBtn = document.createElement('button')
    allowBtn.className = 'securegpt-tooltip-btn securegpt-btn-allow'
    allowBtn.innerText = 'Allow'
    allowBtn.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      onAllow()
    }
    actions.appendChild(allowBtn)
  }

  tooltip.appendChild(actions)
  document.body.appendChild(tooltip)
  tooltipEl = tooltip

  // Position it
  const rect = targetEl.getBoundingClientRect()
  
  const tooltipRect = tooltip.getBoundingClientRect()
  let top = rect.top - tooltipRect.height - 8
  
  if (top < 0) {
    top = rect.bottom + 8
  }
  
  tooltip.style.top = `${top + window.scrollY}px`
  tooltip.style.left = `${rect.left + window.scrollX}px`
}

export function removeLiveWarningTooltip() {
  if (tooltipEl) {
    tooltipEl.remove()
    tooltipEl = null
  }
}
