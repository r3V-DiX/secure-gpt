// packages/extension/src/content/modal-theme-tokens.ts
// Unified Dark & Light theme tokens for ShieldModal

export const MODAL_THEME_TOKENS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :host {
    display: block;
    width: 100%;
    height: 100%;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    
    /* Light Mode Palette */
    --bg-base: #f8fafc;
    --bg-surface: #ffffff;
    --bg-surface-2: #f1f5f9;
    --bg-surface-3: #e2e8f0;
    --border: #e2e8f0;
    --border-strong: #cbd5e1;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-tertiary: #64748b;
    --text-muted: #94a3b8;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
    --accent-light: #eff6ff;
    --accent-border: #bfdbfe;
    --accent-text: #1d4ed8;
    --shadow-modal: 0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);

    --cat-red-bg: #fef2f2;
    --cat-red-border: #fecaca;
    --cat-red-text: #b91c1c;
    --cat-red-dot: #f87171;

    --cat-amber-bg: #fffbeb;
    --cat-amber-border: #fde68a;
    --cat-amber-text: #b45309;
    --cat-amber-dot: #fbbf24;

    --cat-purple-bg: #faf5ff;
    --cat-purple-border: #e9d5ff;
    --cat-purple-text: #7e22ce;
    --cat-purple-dot: #c084fc;

    --cat-blue-bg: #eff6ff;
    --cat-blue-border: #bfdbfe;
    --cat-blue-text: #1d4ed8;
    --cat-blue-dot: #60a5fa;

    --entity-row-bg: rgba(255, 255, 255, 0.85);
    --entity-code-bg: rgba(0, 0, 0, 0.05);
    --entity-code-text: #1e293b;
  }

  :host(.dark) {
    /* Dark Obsidian Cyber Palette */
    --bg-base: #070a12;
    --bg-surface: #0d1322;
    --bg-surface-2: #131c31;
    --bg-surface-3: #1b2742;
    --border: rgba(255, 255, 255, 0.10);
    --border-strong: rgba(255, 255, 255, 0.20);
    --text-primary: #f8fafc;
    --text-secondary: #cbd5e1;
    --text-tertiary: #94a3b8;
    --text-muted: #64748b;
    --accent: #38bdf8;
    --accent-hover: #0ea5e9;
    --accent-light: rgba(56, 189, 248, 0.15);
    --accent-border: rgba(56, 189, 248, 0.30);
    --accent-text: #7dd3fc;
    --shadow-modal: 0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08);

    --cat-red-bg: rgba(239, 68, 68, 0.12);
    --cat-red-border: rgba(239, 68, 68, 0.30);
    --cat-red-text: #fca5a5;
    --cat-red-dot: #f87171;

    --cat-amber-bg: rgba(245, 158, 11, 0.12);
    --cat-amber-border: rgba(245, 158, 11, 0.30);
    --cat-amber-text: #fcd34d;
    --cat-amber-dot: #fbbf24;

    --cat-purple-bg: rgba(168, 85, 247, 0.12);
    --cat-purple-border: rgba(168, 85, 247, 0.30);
    --cat-purple-text: #d8b4fe;
    --cat-purple-dot: #c084fc;

    --cat-blue-bg: rgba(59, 130, 246, 0.12);
    --cat-blue-border: rgba(59, 130, 246, 0.30);
    --cat-blue-text: #93c5fd;
    --cat-blue-dot: #60a5fa;

    --entity-row-bg: rgba(19, 28, 49, 0.85);
    --entity-code-bg: rgba(0, 0, 0, 0.40);
    --entity-code-text: #f1f5f9;
  }
`;
