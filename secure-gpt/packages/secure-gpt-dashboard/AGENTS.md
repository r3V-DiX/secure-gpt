<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:frontend-design-system-rules -->
# SecureGPT Frontend Development Rules & Guidelines

You are modifying the SecureGPT enterprise frontend. Follow these mandatory rules for all UI, page, component, and style changes.

## 1. Design System & Token Hierarchy
- **NO Hardcoded Colors:** Never use raw colors (`#1e293b`, `bg-blue-600`, `text-indigo-500`, `text-rose-400`).
- **Use Semantic CSS Variables:** Always use defined CSS tokens via Tailwind arbitrary values:
  - Backgrounds: `bg-[var(--bg-base)]`, `bg-[var(--bg-surface)]`, `bg-[var(--bg-surface-2)]`, `bg-[var(--bg-surface-3)]`
  - Borders: `border-[var(--border)]`, `border-[var(--border-2)]`, `border-[var(--border-strong)]`
  - Text: `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, `text-[var(--text-tertiary)]`, `text-[var(--text-muted)]`
  - Brand/Accent: `bg-[var(--accent)]`, `hover:bg-[var(--accent-hover)]`, `text-[var(--accent-text)]`
  - Status: `[var(--success)]`, `[var(--warning)]`, `[var(--danger)]`, `[var(--info)]`
- **Class vs Style Tag:** Avoid inline `style={{ ... }}` objects for static styling. Use Tailwind classes (e.g. `className="text-[var(--text-primary)]"`).
- **Never Invent Tokens:** Never invent tokens like `--border-subtle` or `--bg-hover` that are not defined in `globals.css`.

## 2. Component Reuse Checklist (DO NOT RE-INVENT)
Before writing custom UI elements, reuse existing primitives from `@/components/ui`:
- **Buttons:** `<Button variant="primary|secondary|danger|ghost" size="sm|md|lg" loading={...} icon={...}>`
- **Inputs & Selects:** `<Input error={...} icon={...} />`, `<Select error={...}>`
- **Cards:** `<Card>`, `<CardHeader>`, `<CardContent>`
- **Badges:** `<Badge variant="default|success|warning|danger|info|neutral" dot>`
- **DLP Action Badges:** `<ActionBadge action={actionString} />`
- **Modals & Dialogs:** `<Modal open onClose size="sm|md|lg">` and subcomponents
- **Confirmations:** `const { confirm } = useModal()` or `const confirm = useDangerConfirm()`
- **Tables:** `<DataTable<T> columns={cols} data={data} rowKey={row => row.id} loading={...} />`
- **Metric Cards:** `<StatCard label={...} value={...} change={...} icon={...} />`
- **Empty States:** `<EmptyState title={...} description={...} action={...} />`

## 3. Visual & Aesthetic Tone (Enterprise Clean)
- **Primary Theme:** Light Mode is the primary default experience. Dark mode is handled seamlessly via CSS variables.
- **Forbidden Patterns:** 
  - NO Web3/crypto neon gradients or glowing card borders.
  - NO emojis in status indicators, table rows, or empty states (use `lucide-react` icons).
  - NO playful/conversational headers (e.g., "Good morning Anshul 👋"). Use structured administrative titles.
- **Border Radii:** Use `rounded-2xl` for major cards and modals; `rounded-xl` or `rounded-lg` for buttons and inputs; `rounded-full` for badges/avatars.

## 4. Pre-Completion Verification
Before submitting any frontend task:
1. Verify `npm run lint` passes without ESLint errors.
2. Confirm both Light and Dark mode appearances work without inverted contrast artifacts.
3. Ensure no new raw Tailwind colors (e.g. `bg-gray-100`, `text-blue-600`) were introduced.
<!-- END:frontend-design-system-rules -->
