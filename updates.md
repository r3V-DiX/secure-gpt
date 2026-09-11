# SecureGPT Product & Engineering Roadmap / Updates

### 🚀 Phase 1: Core Product, Critical Fixes & Org Onboarding (Top Priority)

### 1. Interception & Policy Controls
- [ ] **Prompt Evaluation UX**:
  - Remove live blocking prompt keystroke interception before pressing `Enter` to avoid typing lag and DOM interference.
  - Add a non-intrusive circular risk badge / radial percentage gauge anchored on the right of input fields that updates dynamically.
- [ ] **Document Scanning Policy**:
  - Add policy toggle to enable or disable document scanning (allowing admins to choose whether files/documents are inspected).
- [ ] **Policy Platform Expansion**:
  - Add support and coverage for at least 15+ LLM sites in policy and content scripts (ChatGPT, Claude, Gemini, Copilot, Perplexity, Poe, Mistral, Cursor, v0, Replit, HuggingChat, DeepSeek, Phind, Notion AI, Jasper, Copy.ai).

### 2. Critical Bug Fixes & Stability
- [ ] **Fix Policy Updation (Circular JSON Error)**:
  - *Issue:* `Converting circular structure to JSON --> starting at object with constructor 'HTMLButtonElement' | property '__reactFiber$...' -> stateNode`.
  - *Fix:* Sanitize event handlers in admin UI (`SaveBar` and mutation triggers) to avoid passing synthetic React events / DOM nodes into JSON payload or mutation functions.
- [ ] **Fix Authentication & Login (Existing Users & Admins)**:
  - Fix login failure for existing users (session handling, token expiration/refresh, auth backward compatibility).
  - Fix login failure for Admins in admin portal (callback routing, role verification, and token exchange).

### 3. Identity, Login & Organization UI (TPRM-Style Onboarding)
- [ ] **Microsoft OAuth & Enterprise SSO Integration**:
  - Implement Microsoft Entra ID (Azure AD / Office 365) OAuth login alongside existing Google OAuth for both web dashboards and browser extension authentication.
- [ ] **Revamp Organization Login UI**:
  - Redesign organization sign-in screen supporting company workspace slug routing and enterprise SSO (Microsoft & Google Workspace).
- [ ] **Account Type & Role Badge in UI**:
  - Display clear visual badge in the UI showing exactly how the user is logged in:
    - `Organization`
    - `Employee`
    - `Org Admin`
    - `Super Admin`
    - `Personal User`
- [ ] **Domain Verification Gating**:
  - Prevent team/org admins from inviting employees before verifying company domain ownership (via DNS TXT record or meta tag).
  - Add an interactive guided onboarding tour / walkthrough explaining the verification process.
- [ ] **Role Management (RBAC)**:
  - Allow organization admins to view and change roles of users directly from the team table.
- [ ] **Dashboard Analytics**:
  - Display leaderboard of top employees / departments by policy triggers on the admin dashboard.
- [ ] **Redesign "Get Started" Page**:
  - Overhaul the get started page to provide a clear, role-appropriate checklist for new organizations and users.
- [ ] **Quick Back-Navigation Link from Department Policy to Org/Admin View**:
  - When an admin clicks "Configure Policy" from Team & Org (redirecting to `/policy?department_id=...` for a specific sub-category/department like Engineering, Finance, etc.), provide a sticky/prominent "← Back to Team & Organization" navigation link on the policy page to return directly to the org view.

### 4. Release Engineering & Audit Tracking
- [x] **Production Release Tracker (Current: v1.0.0)**:
  - Establish a single source of truth for every update in production (`RELEASE_TRACKER.md`).
  - Implement a public, unauthenticated system version endpoint (`/api/v1/system/version`) to report live deployed build versions.
  - Added visual version badges to dashboards and verification checks to update scripts.

---

## 🛠️ Phase 2: Role-Specific UX Enhancements & Safety Nets

### Super Admin UI/UX
- [ ] **Callback Route Robustness**:
  - Fix brittle role checking in `/callback` to prevent unexpected redirects to the user dashboard for secondary admin roles.
- [ ] **Tenant Impersonation ("Login-As Org")**:
  - Enable Super Admins to view an organization's policies, telemetry, and incidents in read-only mode for support and troubleshooting.
- [ ] **Emergency Organization Freeze / Killswitch**:
  - Add one-click action to revoke tokens and temporarily pause extension enforcement for a compromised or delinquent organization.

### Org Admin UI/UX
- [ ] **Policy Inheritance & Scope Visibility**:
  - Clearly visually distinguish between Organization Master Policies and Department Overrides so admins know when a rule is inherited or overridden.
- [ ] **DNS Verification Live Diagnostic**:
  - Add real-time DNS lookup status feedback (e.g., checking TXT record propagation, expected vs. found values) directly in the UI.

### Employee & Personal UX
- [ ] **Business Justification in Shield Modal ("Break-Glass")**:
  - Provide an optional justification text input when a prompt or file triggers a `WARN` or `BLOCK`, logging the reason for compliance review.
- [ ] **Extension Shadow DOM Focus & Z-Index Guard**:
  - Ensure the extension modal correctly captures keyboard focus and overlays seamlessly on portal-heavy web apps (Claude, Perplexity).
- [ ] **Extension Policy Sync Indicator & Fast Allowlist**:
  - Display whether the extension is running on Cloud Synced Policy or Offline Fallback Rules.
  - Allow users to "Mark as False Positive" / "Allowlist phrase" directly from the extension popup or warning banner.
- [ ] **Clean Session Expiration Handling**:
  - Prevent infinite redirect loops on expired tokens: cleanly prompt re-authentication and clear stale session state.

---

## 🌐 Phase 3: Advanced Enterprise DLP & Integrations

- [ ] **Custom Enterprise Data Rules**:
  - Admin-defined custom regex patterns and keyword dictionary lists (e.g., internal project codenames, custom API keys, internal account IDs).
- [ ] **Tiered Policy Enforcement**:
  - Granular action configuration per sensitivity tier: `ALLOW`, `WARN` (confirmation prompt), `MASK` (redact PII/secrets), or `BLOCK`.
- [ ] **SIEM & Webhook Streaming**:
  - Stream violation and audit logs to external security platforms (Datadog, Splunk, Microsoft Sentinel, or Slack/Teams webhooks).
- [ ] **Enterprise MDM / Chrome Managed Policy**:
  - Support managed Chrome policy distribution (`managed_schema.json`) for seamless zero-touch enrollment via Google Workspace / Intune / Jamf.
