// packages/extension/src/content/site-indicator-templates.ts

export const INDICATOR_TEMPLATE = (platformLabel: string) => `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    .indicator-wrap {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .floating-pill {
      display: flex;
      align-items: center;
      gap: 7px;
      background: #ffffff;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid #e2e8f0;
      padding: 6px 12px 6px 10px;
      border-radius: 9999px;
      color: #0f172a;
      cursor: pointer;
      user-select: none;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.04);
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .floating-pill:hover {
      background: #f8fafc;
      border-color: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
    }

    .shield-icon {
      font-size: 14px;
      line-height: 1;
    }
    .pill-text {
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse-dot 2s infinite ease-in-out;
    }
    @keyframes pulse-dot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.25); opacity: 0.75; }
    }

    /* ── Flyout Menu ── */
    .flyout-menu {
      position: absolute;
      bottom: calc(100% + 10px);
      right: 0;
      width: 280px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.04);
      display: none;
      flex-direction: column;
      gap: 10px;
      animation: flyout-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .flyout-menu.visible {
      display: flex;
    }
    @keyframes flyout-in {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .flyout-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    .flyout-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .flyout-close {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 13px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .flyout-close:hover {
      color: #0f172a;
      background: #f1f5f9;
    }

    .flyout-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 6px 10px;
      border-radius: 8px;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #0f172a;
      font-weight: 600;
    }
    .badge-success {
      color: #059669;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }

    .flyout-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }
    .btn-action {
      width: 100%;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
  </style>

  <div class="indicator-wrap">
    <div class="floating-pill" id="indicator-pill" title="SecureGPT Active • Click for Protection Details">
      <span class="shield-icon">🛡️</span>
      <span class="pill-text">SecureGPT</span>
      <span class="status-dot"></span>
    </div>

    <div class="flyout-menu" id="flyout-menu">
      <div class="flyout-header">
        <span class="flyout-title">🛡️ Active DLP Protection</span>
        <button class="flyout-close" id="flyout-close-btn">✕</button>
      </div>

      <div class="flyout-body">
        <div class="info-row">
          <span class="info-label">Protected Platform</span>
          <span class="info-value">${platformLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cloud Policy</span>
          <span class="info-value badge-success">● Synced & Active</span>
        </div>
        <div class="info-row">
          <span class="info-label">Scanning Scope</span>
          <span class="info-value">Prompts &amp; Files</span>
        </div>
      </div>

      <div class="flyout-actions">
        <button class="btn-action btn-primary" id="open-guide-btn">
          📖 View Protection Guide
        </button>
      </div>
    </div>
  </div>
`

export const WELCOME_MODAL_TEMPLATE = (platformLabel: string) => `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 2147483646;
      animation: fade-in 0.2s ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-card {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      animation: slide-in 0.24s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(16px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .modal-header {
      padding: 22px 22px 16px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .shield-badge {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
    }
    .header-content {
      flex: 1;
    }
    .modal-title {
      font-size: 15px;
      font-weight: 750;
      color: #0f172a;
      letter-spacing: -0.01em;
    }
    .modal-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #64748b;
      font-size: 14px;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s;
    }
    .close-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }

    .modal-body {
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 10px 14px;
      border-radius: 12px;
    }
    .feature-icon {
      font-size: 16px;
      line-height: 1.2;
    }
    .feature-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .feature-desc {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.4;
    }

    .modal-footer {
      padding: 14px 22px 20px;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .suppress-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      color: #64748b;
      cursor: pointer;
      user-select: none;
    }
    .suppress-row input {
      cursor: pointer;
      accent-color: #2563eb;
    }

    .btn-understood {
      width: 100%;
      padding: 9px 16px;
      background: #2563eb;
      color: #ffffff;
      font-size: 12.5px;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      transition: all 0.15s ease;
      outline: none;
    }
    .btn-understood:hover {
      background: #1d4ed8;
      transform: translateY(-0.5px);
    }
    .btn-understood:focus-visible {
      box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #2563eb;
    }
  </style>

  <div class="backdrop" id="modal-backdrop">
    <div class="modal-card" id="welcome-modal-card">
      <div class="modal-header">
        <div class="shield-badge">🛡️</div>
        <div class="header-content">
          <h2 class="modal-title">SecureGPT Protection Active</h2>
          <p class="modal-subtitle">Enterprise Data Loss Prevention is active on <b>${platformLabel}</b></p>
        </div>
        <button class="close-btn" id="modal-close-btn">✕</button>
      </div>

      <div class="modal-body">
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <div>
            <p class="feature-title">Live Keystroke &amp; Prompt Scanning</p>
            <p class="feature-desc">Intercepts and redacts PII, credentials, API keys, and corporate secrets before they reach the model.</p>
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon">📄</span>
          <div>
            <p class="feature-title">Document &amp; File OCR Redaction</p>
            <p class="feature-desc">Scans and redacts uploaded PDF, Office documents, and pasted screenshots in real-time.</p>
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon">🏢</span>
          <div>
            <p class="feature-title">Organization Policy Compliance</p>
            <p class="feature-desc">Automatically synchronizes with your team's DLP policies and audit requirements.</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <label class="suppress-row">
          <input type="checkbox" id="suppress-checkbox" checked />
          <span>Don't show this welcome dialog for 7 days</span>
        </label>
        <button class="btn-understood" id="btn-understood">
          Understood &bull; Continue
        </button>
      </div>
    </div>
  </div>
`
