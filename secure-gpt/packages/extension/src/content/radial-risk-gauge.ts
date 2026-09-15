// packages/extension/src/content/radial-risk-gauge.ts
import type { PIIEntity, DetectionResult, PIIConfig } from '@securegpt/shared/types'
import { PII_CATEGORY_LABELS, type PIICategory } from '@securegpt/shared/constants'
import { showShieldModal } from './modal-manager'
import { GAUGE_TEMPLATE } from './gauge-templates'

let gaugeHostEl: HTMLElement | null = null
let gaugeShadowRoot: ShadowRoot | null = null
let currentEditorEl: HTMLElement | null = null
let currentEntities: PIIEntity[] = []
let currentText = ''
let currentPolicyConfig: PIIConfig | null = null
let isPopoverOpen = false

function ensureGaugeElement(): { host: HTMLElement; shadow: ShadowRoot } {
  if (gaugeHostEl && gaugeShadowRoot && document.body.contains(gaugeHostEl)) {
    return { host: gaugeHostEl, shadow: gaugeShadowRoot }
  }

  const existing = document.getElementById('securegpt-risk-gauge-host')
  if (existing) existing.remove()

  const host = document.createElement('div')
  host.id = 'securegpt-risk-gauge-host'
  host.style.cssText = [
    'position: absolute',
    'z-index: 2147483640',
    'pointer-events: none',
    'transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    'opacity: 0',
    'transform: scale(0.95)',
  ].join(';')

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = GAUGE_TEMPLATE

  document.body.appendChild(host)
  gaugeHostEl = host
  gaugeShadowRoot = shadow

  const pill = shadow.getElementById('gauge-container')
  const popover = shadow.getElementById('findings-popover')
  const closeBtn = shadow.getElementById('popover-close-btn')
  const inspectBtn = shadow.getElementById('inspect-preview-btn')
  const expandIcon = shadow.getElementById('expand-icon')

  const togglePopover = (open?: boolean) => {
    isPopoverOpen = open !== undefined ? open : !isPopoverOpen
    if (popover && expandIcon) {
      if (isPopoverOpen) {
        popover.classList.add('visible')
        expandIcon.classList.add('open')
      } else {
        popover.classList.remove('visible')
        expandIcon.classList.remove('open')
      }
    }
  }

  pill?.addEventListener('click', (e) => {
    e.stopPropagation()
    togglePopover()
  })

  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    togglePopover(false)
  })

  inspectBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    togglePopover(false)
    if (currentPolicyConfig && currentText) {
      const detectionRes: DetectionResult = {
        hasFindings: currentEntities.length > 0,
        entities: currentEntities,
        tier: 'regex',
        processingTimeMs: 0,
        inputLength: currentText.length,
      }
      showShieldModal(
        detectionRes,
        currentPolicyConfig,
        currentText,
        undefined,
        true,
        'Live Prompt Risk Inspection'
      )
    }
  })

  window.addEventListener('click', (e) => {
    if (isPopoverOpen && !host.contains(e.target as Node)) {
      togglePopover(false)
    }
  })

  return { host, shadow }
}

function repositionGauge(): void {
  if (!gaugeHostEl || !currentEditorEl || !document.body.contains(currentEditorEl)) return

  const composerContainer = (
    currentEditorEl.closest('form, [class*="composer"], [class*="input-area"], [class*="chat-input"], [class*="prose"], fieldset') as HTMLElement
  ) || currentEditorEl

  const rect = composerContainer.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  const badgeWidth = 125
  const top = window.scrollY + Math.max(8, rect.top - 32)
  const left = Math.max(window.scrollX + 10, window.scrollX + rect.right - badgeWidth)

  gaugeHostEl.style.top = top + 'px'
  gaugeHostEl.style.left = left + 'px'
}

export function updateRadialRiskGauge(
  editorEl: HTMLElement,
  findingsCount: number,
  entities: PIIEntity[] = [],
  text = '',
  policyConfig: PIIConfig | null = null
): void {
  if (!editorEl || !document.body.contains(editorEl)) {
    hideRadialRiskGauge()
    return
  }

  currentEditorEl = editorEl
  currentEntities = entities
  currentText = text
  currentPolicyConfig = policyConfig

  const { host, shadow } = ensureGaugeElement()
  repositionGauge()

  host.style.opacity = '1'
  host.style.transform = 'scale(1)'

  let percent = 0
  let color = '#10b981'
  let status = 'Clean'

  if (findingsCount > 0) {
    const hasCritical = entities.some((e) => e.severity === 'critical' || e.category === 'CONFIDENTIAL')
    const hasHigh = entities.some((e) => e.severity === 'high' || e.category === 'FINANCIAL')

    if (hasCritical) {
      percent = Math.min(100, 75 + findingsCount * 8)
      color = '#ef4444'
      status = 'Critical'
    } else if (hasHigh) {
      percent = Math.min(85, 50 + findingsCount * 10)
      color = '#f59e0b'
      status = 'High Risk'
    } else {
      percent = Math.min(60, 25 + findingsCount * 10)
      color = '#38bdf8'
      status = 'Detected'
    }
  }

  const progressCircle = shadow.getElementById('progress-circle') as SVGCircleElement | null
  const gaugeLabel = shadow.getElementById('gauge-label')
  const gaugeStatus = shadow.getElementById('gauge-status')
  const entityListBox = shadow.getElementById('entity-list-box')

  if (progressCircle && gaugeLabel && gaugeStatus) {
    const circumference = 44
    const offset = circumference - (percent / 100) * circumference
    progressCircle.style.strokeDashoffset = String(offset)
    progressCircle.style.stroke = color
    gaugeLabel.innerText = percent + '%'
    gaugeLabel.style.color = color
    gaugeStatus.innerText = status
  }

  if (entityListBox) {
    if (entities.length === 0) {
      entityListBox.innerHTML = `
        <div style="color:#94a3b8; font-size:10.5px; text-align:center; padding: 6px 0;">
          No sensitive data detected in prompt.
        </div>
      `
    } else {
      const counts: Record<string, number> = {}
      for (const ent of entities) {
        const cat = ent.category as PIICategory
        const label = PII_CATEGORY_LABELS[cat] || cat
        counts[label] = (counts[label] || 0) + 1
      }

      entityListBox.innerHTML = Object.entries(counts)
        .map(
          ([label, count]) => `
          <div class="entity-item">
            <span class="entity-name">${label}</span>
            <span class="entity-count">${count} found</span>
          </div>
        `
        )
        .join('')
    }
  }
}

export function hideRadialRiskGauge(): void {
  if (gaugeHostEl) {
    gaugeHostEl.style.opacity = '0'
    gaugeHostEl.style.transform = 'scale(0.95)'
    isPopoverOpen = false
    const popover = gaugeShadowRoot?.getElementById('findings-popover')
    const expandIcon = gaugeShadowRoot?.getElementById('expand-icon')
    popover?.classList.remove('visible')
    expandIcon?.classList.remove('open')
  }
}

window.addEventListener('resize', repositionGauge, { passive: true })
window.addEventListener('scroll', repositionGauge, { passive: true })
