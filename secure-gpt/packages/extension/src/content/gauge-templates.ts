// packages/extension/src/content/gauge-templates.ts

export const GAUGE_TEMPLATE = `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    
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
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 4px 9px 4px 6px;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0,0,0,0.1);
      color: #f8fafc;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    .gauge-pill:hover {
      background: rgba(15, 23, 42, 0.98);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.38);
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
      stroke: rgba(255, 255, 255, 0.15);
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
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .popover-title {
      font-size: 11px;
      font-weight: 700;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .popover-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 12px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .popover-close:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }

    .entity-summary-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-height: 140px;
      overflow-y: auto;
    }
    .entity-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.06);
      padding: 5px 8px;
      border-radius: 6px;
      font-size: 10.5px;
    }
    .entity-name {
      color: #e2e8f0;
      font-weight: 500;
    }
    .entity-count {
      font-weight: 700;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.15);
      padding: 1px 5px;
      border-radius: 4px;
    }

    .popover-actions {
      display: flex;
      gap: 6px;
      margin-top: 4px;
    }
    .preview-btn {
      flex: 1;
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 6px 10px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.15s ease;
    }
    .preview-btn:hover {
      background: #1d4ed8;
    }
  </style>

  <div class="gauge-wrapper">
    <div class="gauge-pill" id="gauge-container" title="SecureGPT Live Risk Assessment (Click to Inspect)">
      <div class="circle-box">
        <svg>
          <circle class="bg-circle"></circle>
          <circle class="progress-circle" id="progress-circle"></circle>
        </svg>
      </div>
      <span class="label" id="gauge-label">0%</span>
      <span class="status-text" id="gauge-status">Clean</span>
      <span class="expand-icon" id="expand-icon">▾</span>
    </div>

    <div class="popover" id="findings-popover">
      <div class="popover-header">
        <span class="popover-title">🛡️ Detection Breakdown</span>
        <button class="popover-close" id="popover-close-btn">✕</button>
      </div>
      <div class="entity-summary-list" id="entity-list-box">
        <!-- Populated dynamically -->
      </div>
      <div class="popover-actions">
        <button class="preview-btn" id="inspect-preview-btn">
          🔍 Inspect Findings
        </button>
      </div>
    </div>
  </div>
`
