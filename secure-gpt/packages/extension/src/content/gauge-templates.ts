// packages/extension/src/content/gauge-templates.ts
// Dynamic Dark & Light theme template for the Radial Risk Gauge

export const GAUGE_TEMPLATE = `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      
      /* Light Mode */
      --gauge-bg: rgba(255, 255, 255, 0.96);
      --gauge-border: #e2e8f0;
      --gauge-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
      --gauge-text: #0f172a;
      --gauge-subtext: #64748b;
      --gauge-bg-circle: #e2e8f0;
      
      --popover-bg: #ffffff;
      --popover-border: #e2e8f0;
      --popover-shadow: 0 12px 36px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
      --popover-title: #0f172a;
      --popover-item-bg: #f8fafc;
      --popover-item-border: #f1f5f9;
      --popover-item-text: #334155;
      --popover-btn-bg: #2563eb;
      --popover-btn-hover: #1d4ed8;
      --popover-btn-text: #ffffff;
    }

    
    .gauge-wrapper {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .gauge-pill {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--gauge-bg);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 4px 9px 4px 6px;
      border-radius: 9999px;
      border: 1px solid var(--gauge-border);
      box-shadow: var(--gauge-shadow);
      color: var(--gauge-text);
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    .gauge-pill:hover {
      transform: translateY(-1px);
    }

    .circle-box {
      position: relative;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      transform: rotate(-90deg);
      width: 18px;
      height: 18px;
    }
    circle {
      fill: none;
      stroke-width: 2.4;
      stroke-linecap: round;
      cx: 9;
      cy: 9;
      r: 7;
    }
    .bg-circle {
      stroke: var(--gauge-bg-circle);
    }
    .progress-circle {
      stroke-dasharray: 44;
      stroke-dashoffset: 44;
      transition: stroke-dashoffset 0.35s ease, stroke 0.35s ease;
    }

    .label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.02em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .status-text {
      font-size: 9.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.9;
    }
    .expand-icon {
      font-size: 9px;
      opacity: 0.6;
      transition: transform 0.2s ease;
    }
    .expand-icon.open {
      transform: rotate(180deg);
    }

    /* ── Popover ── */
    .popover {
      pointer-events: auto;
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 260px;
      background: var(--popover-bg);
      border: 1px solid var(--popover-border);
      border-radius: 12px;
      padding: 12px;
      box-shadow: var(--popover-shadow);
      display: none;
      flex-direction: column;
      gap: 8px;
      z-index: 2147483645;
      animation: pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .popover.visible {
      display: flex;
    }
    @keyframes pop-in {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--popover-border);
    }
    .popover-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--popover-title);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .popover-close {
      background: transparent;
      border: none;
      color: var(--gauge-subtext);
      font-size: 12px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .popover-close:hover {
      color: var(--gauge-text);
    }

    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 140px;
      overflow-y: auto;
    }
    .finding-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--popover-item-bg);
      border: 1px solid var(--popover-item-border);
      padding: 4px 7px;
      border-radius: 6px;
      font-size: 10px;
      color: var(--popover-item-text);
    }
    .finding-type {
      font-weight: 600;
      text-transform: capitalize;
    }
    .finding-badge {
      font-size: 9px;
      padding: 1px 4px;
      border-radius: 4px;
      font-weight: 700;
    }

    .inspect-btn {
      background: var(--popover-btn-bg);
      color: var(--popover-btn-text);
      border: none;
      padding: 6px 10px;
      border-radius: 7px;
      font-size: 10.5px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.15s ease;
      margin-top: 2px;
      outline: none;
    }
    .inspect-btn:hover {
      background: var(--popover-btn-hover);
      transform: translateY(-0.5px);
    }
    .inspect-btn:focus-visible {
      box-shadow: 0 0 0 2px var(--popover-bg), 0 0 0 4px var(--popover-btn-bg);
    }
  </style>

  <div class="gauge-wrapper">
    <div class="gauge-pill" id="gauge-container" title="SecureGPT Real-time Risk Assessment">
      <div class="circle-box">
        <svg viewBox="0 0 18 18">
          <circle class="bg-circle" />
          <circle class="progress-circle" id="risk-circle" />
        </svg>
      </div>
      <span class="label" id="risk-percentage">0%</span>
      <span class="status-text" id="risk-status">Clean</span>
      <span class="expand-icon" id="expand-icon">▼</span>
    </div>

    <!-- Dropdown Mini-Popover -->
    <div class="popover" id="findings-popover">
      <div class="popover-header">
        <div class="popover-title">
          <span>🛡️ Live Risk Findings</span>
        </div>
        <button class="popover-close" id="popover-close-btn">✕</button>
      </div>
      <div class="findings-list" id="findings-list">
        <!-- Injected findings -->
      </div>
      <button class="inspect-btn" id="inspect-preview-btn">
        🔍 Inspect Policy &amp; Masking
      </button>
    </div>
  </div>
`
