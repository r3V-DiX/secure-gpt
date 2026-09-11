// packages/extension/src/content/radial-risk-gauge.ts
import type { PIIEntity } from '@securegpt/shared/types'

let gaugeHostEl: HTMLElement | null = null
let gaugeShadowRoot: ShadowRoot | null = null

function ensureGaugeElement(): { host: HTMLElement; shadow: ShadowRoot } {
  if (gaugeHostEl && gaugeShadowRoot && document.body.contains(gaugeHostEl)) {
    return { host: gaugeHostEl, shadow: gaugeShadowRoot }
  }

  const existing = document.getElementById('securegpt-risk-gauge-host')
  if (existing) existing.remove()

  const host = document.createElement('div')
  host.id = 'securegpt-risk-gauge-host'
  host.style.cssText = 'position:absolute;z-index:2147483640;pointer-events:none;transition:opacity 0.2s ease, transform 0.2s ease;opacity:0;transform:scale(0.9);'

  const shadow = host.attachShadow({ mode: 'open' })
  shadow.innerHTML = "<style>.gauge-wrap{pointer-events:auto;display:flex;align-items:center;gap:6px;background:rgba(15,23,42,0.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:4px 8px 4px 5px;border-radius:9999px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 4px 14px rgba(0,0,0,0.25);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f8fafc;cursor:pointer;user-select:none}.circle-box{position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center}svg{transform:rotate(-90deg);width:22px;height:22px}circle{fill:none;stroke-width:2.5;stroke-linecap:round;cx:11;cy:11;r:8.5}.bg-circle{stroke:rgba(255,255,255,0.15)}.progress-circle{stroke-dasharray:53.4;stroke-dashoffset:53.4;transition:stroke-dashoffset 0.35s ease,stroke 0.35s ease}.label{font-size:11px;font-weight:700;letter-spacing:0.02em;line-height:1;font-variant-numeric:tabular-nums}.status-text{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;opacity:0.85}</style><div class=\"gauge-wrap\" id=\"gauge-container\" title=\"SecureGPT Live Risk Assessment\"><div class=\"circle-box\"><svg><circle class=\"bg-circle\"></circle><circle class=\"progress-circle\" id=\"progress-circle\"></circle></svg></div><span class=\"label\" id=\"gauge-label\">0%</span><span class=\"status-text\" id=\"gauge-status\">Clean</span></div>"

  document.body.appendChild(host)
  gaugeHostEl = host
  gaugeShadowRoot = shadow
  return { host, shadow }
}

export function updateRadialRiskGauge(
  editorEl: HTMLElement,
  findingsCount: number,
  entities: PIIEntity[] = []
): void {
  if (!editorEl || !document.body.contains(editorEl)) {
    hideRadialRiskGauge()
    return
  }

  const { host, shadow } = ensureGaugeElement()
  const rect = editorEl.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    hideRadialRiskGauge()
    return
  }

  const top = window.scrollY + rect.top + 8
  const left = Math.max(window.scrollX + rect.left + 10, window.scrollX + rect.right - 115)

  host.style.top = top + 'px'
  host.style.left = left + 'px'
  host.style.opacity = '1'
  host.style.transform = 'scale(1)'

  let percent = 0
  let color = '#10b981'
  let status = 'Clean'

  if (findingsCount > 0) {
    const hasCritical = entities.some(e => e.severity === 'critical' || e.category === 'CONFIDENTIAL')
    const hasHigh = entities.some(e => e.severity === 'high' || e.category === 'FINANCIAL')

    if (hasCritical) {
      percent = Math.min(100, 75 + (findingsCount * 8))
      color = '#ef4444'
      status = 'Critical'
    } else if (hasHigh) {
      percent = Math.min(85, 50 + (findingsCount * 10))
      color = '#f59e0b'
      status = 'High Risk'
    } else {
      percent = Math.min(60, 25 + (findingsCount * 10))
      color = '#38bdf8'
      status = 'Detected'
    }
  }

  const progressCircle = shadow.getElementById('progress-circle') as SVGCircleElement | null
  const gaugeLabel = shadow.getElementById('gauge-label')
  const gaugeStatus = shadow.getElementById('gauge-status')

  if (progressCircle && gaugeLabel && gaugeStatus) {
    const circumference = 53.4
    const offset = circumference - (percent / 100) * circumference
    progressCircle.style.strokeDashoffset = String(offset)
    progressCircle.style.stroke = color
    gaugeLabel.innerText = percent + '%'
    gaugeLabel.style.color = color
    gaugeStatus.innerText = status
  }
}

export function hideRadialRiskGauge(): void {
  if (gaugeHostEl) {
    gaugeHostEl.style.opacity = '0'
    gaugeHostEl.style.transform = 'scale(0.9)'
  }
}
