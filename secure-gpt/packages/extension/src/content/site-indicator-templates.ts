// packages/extension/src/content/site-indicator-templates.ts

export { WELCOME_MODAL_TEMPLATE } from "./welcome-modal-template";

export const INDICATOR_TEMPLATE = (platformLabel: string) => `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

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
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2563eb;
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
    @media (prefers-reduced-motion: reduce) {
      .status-dot { animation: none; }
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
      <span class="shield-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      </span>
      <span class="pill-text">SecureGPT</span>
      <span class="status-dot"></span>
    </div>

    <div class="flyout-menu" id="flyout-menu">
      <div class="flyout-header">
        <span class="flyout-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          Active DLP Protection
        </span>
        <button class="flyout-close" id="flyout-close-btn" aria-label="Close">✕</button>
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
          View Protection Details
        </button>
      </div>
    </div>
  </div>
`;
