// packages/extension/src/content/welcome-modal-template.ts

export const WELCOME_MODAL_TEMPLATE = (platformLabel: string) => `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

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
      to   { opacity: 1; }
    }

    .modal-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.16), 0 4px 16px rgba(15, 23, 42, 0.08);
      width: 100%;
      max-width: 440px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: scale-up 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes scale-up {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-header {
      padding: 18px 20px 14px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .shield-badge {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #eff6ff;
      border: 1px solid #dbeafe;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .header-content { flex: 1; }
    .modal-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
      line-height: 1.3;
    }
    .modal-subtitle {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.4;
    }
    .modal-subtitle b { color: #334155; }
    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      font-size: 14px;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .close-btn:hover { background: #f1f5f9; color: #0f172a; }

    .modal-body {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .feature-icon {
      font-size: 16px;
      line-height: 1;
      padding-top: 1px;
      flex-shrink: 0;
    }
    .feature-title {
      font-size: 12px;
      font-weight: 650;
      color: #1e293b;
      line-height: 1.3;
    }
    .feature-desc {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      margin-top: 2px;
    }

    .modal-footer {
      padding: 14px 20px 16px;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .suppress-row {
      display: flex;
      align-items: center;
      gap: 7px;
      cursor: pointer;
      font-size: 11px;
      color: #64748b;
      user-select: none;
    }
    .suppress-row input {
      accent-color: #2563eb;
      cursor: pointer;
    }
    .btn-understood {
      width: 100%;
      height: 34px;
      background: #2563eb;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
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
        <div class="shield-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="header-content">
          <h2 class="modal-title">SecureGPT Protection Active</h2>
          <p class="modal-subtitle">Enterprise Data Loss Prevention is active on <b>${platformLabel}</b></p>
        </div>
        <button class="close-btn" id="modal-close-btn" aria-label="Close">✕</button>
      </div>

      <div class="modal-body">
        <div class="feature-item">
          <span class="feature-icon" style="color: #2563eb; display: flex;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </span>
          <div>
            <p class="feature-title">Live Keystroke &amp; Prompt Scanning</p>
            <p class="feature-desc">Intercepts and redacts PII, credentials, API keys, and corporate secrets before they reach the model.</p>
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon" style="color: #2563eb; display: flex;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </span>
          <div>
            <p class="feature-title">Document &amp; File OCR Redaction</p>
            <p class="feature-desc">Scans and redacts uploaded PDF, Office documents, and pasted screenshots in real-time.</p>
          </div>
        </div>

        <div class="feature-item">
          <span class="feature-icon" style="color: #2563eb; display: flex;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01"/>
              <path d="M16 6h.01"/>
              <path d="M12 6h.01"/>
              <path d="M12 10h.01"/>
              <path d="M12 14h.01"/>
              <path d="M16 10h.01"/>
              <path d="M16 14h.01"/>
              <path d="M8 10h.01"/>
              <path d="M8 14h.01"/>
            </svg>
          </span>
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
`;
