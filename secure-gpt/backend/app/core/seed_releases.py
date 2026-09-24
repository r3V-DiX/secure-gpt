# backend/app/core/seed_releases.py
# ─────────────────────────────────────────────────────────────────────────────
# Seeder for System Releases with complete v1.0.0 through v1.1.5 history
# ─────────────────────────────────────────────────────────────────────────────

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system_release import SystemRelease

logger = logging.getLogger(__name__)

INITIAL_RELEASES = [
    # ── BASELINE RELEASES ──
    {
        "component": "baseline",
        "version": "1.1.5",
        "release_date": "September 23, 2026",
        "status": "Production Stable",
        "tag": "Dynamic Database-Backed Changelog & Refined Developer UI",
        "commit_hash": "prod-v1.1.5",
        "summary": "Decoupled static version strings into dynamic PostgreSQL release records with single source of truth propagation, unified design-token typography, and zero-downtime changelog publishing.",
        "info": "SecureGPT Core Platform v1.1.5 transitions the versioning engine to a full PostgreSQL-backed model with live client synchronization, Super Admin CRUD endpoints, and refined 1px border architecture across all enterprise console surfaces.",
        "whats_new": [
            "Dynamic single-source-of-truth version propagation across Navbar, Footer, Sidebar, and Version Modals.",
            "PostgreSQL-backed SystemRelease model enabling instant changelog publishing without redeployments.",
            "Unified Hugeicons iconography engine with 1.5px stroke precision across all data tables and policy cards.",
            "Refined 6px container geometry removing artificial shadows and bloated card radiuses."
        ],
        "changed_functionality": [
            "Refactored /versions page to stream changelog entries dynamically via /api/v1/system/releases.",
            "Replaced static JSON manifests with reactive React useSystemVersion context provider."
        ],
        "improvements": [
            "Instant client-side fallback ensuring 100% uptime for version badges even during database maintenance.",
            "Tightened data density across audit tables, platform monitor grids, and modal dialogs."
        ],
        "problems_solved": [
            "Eliminated hardcoded version string disparity between backend, extension, and dashboard.",
            "Resolved inconsistent border radius tokens across auth and settings dialogs."
        ],
        "order_index": 1,
    },
    {
        "component": "baseline",
        "version": "1.1.4",
        "release_date": "September 17, 2026",
        "status": "Production Stable",
        "tag": "Interactive Role Tours & High-Contrast Visual Engine",
        "commit_hash": "prod-v1.1.4",
        "summary": "Modular role-based onboarding tours & Get Started workflows across Super Admin, Org Admin, Employee, and Personal User personas, alongside enterprise-grade typography contrast enhancements.",
        "info": "SecureGPT Core Platform v1.1.4 delivers modular role-specific guided onboarding with React Joyride, high-contrast accessible design tokens across light and dark themes, and live bidirectional telemetry synchronization.",
        "whats_new": [
            "Modular role-specific interactive Joyride tours customized dynamically for Super Admin, Org Admin, Employee, and Personal User accounts.",
            "Dedicated Get Started onboarding checklists with real-time status tracking tailored to user roles.",
            "High-contrast typography and design token upgrades ensuring strict WCAG AAA contrast across all KPI cards, sidebars, and empty states.",
            "Live cloud telemetry sync in Chrome extension popup mirroring dashboard analytics in real time."
        ],
        "changed_functionality": [
            "Refactored onboarding tour configs into modular role-specific definitions without single-file bloat.",
            "Updated extension log ingestion to automatically capture and associate organization tenancy metadata."
        ],
        "improvements": [
            "Crystal-clear readability on all metric numbers and subtitle elements in both light and dark modes.",
            "Instant responsive state updates when toggling protection or changing organization scopes."
        ],
        "problems_solved": [
            "Fixed faint and low-opacity subtitle text on sidebar brand headers and version tags.",
            "Resolved metric disparity between extension session counters and dashboard analytics."
        ],
        "order_index": 2,
    },
    {
        "component": "baseline",
        "version": "1.1.3",
        "release_date": "September 16, 2026",
        "status": "Production Stable",
        "tag": "Enterprise Scale & Bulk Operations Suite",
        "commit_hash": "prod-v1.1.3",
        "summary": "Enterprise-grade employee roster management scaled for 1,000+ employees with server-side pagination, live debounced search and filtering, floating bulk operations toolbar, and CSV roster import & export.",
        "info": "SecureGPT Core Platform v1.1.3 unlocks enterprise scalability with streamlined roster controls, bulk department assignments, role switching, and one-click CSV roster import.",
        "whats_new": [
            "Server-side paginated team and user rosters supporting organizations with 1,000+ employees.",
            "Live debounced search (by email and name) and multi-dimensional filters for departments and roles.",
            "Floating bulk operations action bar for multi-user status changes, department assignments, and removals.",
            "Enterprise CSV import wizard with client-side syntax verification and bulk database persistence."
        ],
        "changed_functionality": [
            "Separated Super Admin global user management from Org Admin team roster.",
            "Replaced client-side array filtering with indexed PostgreSQL ILIKE queries."
        ],
        "improvements": [
            "Ultra-smooth 60fps scrolling on large user rosters with skeleton loading states.",
            "Responsive floating bulk actions toolbar with automatic selection counts."
        ],
        "problems_solved": [
            "Fixed browser freeze when rendering 500+ team members on a single page.",
            "Prevented duplicate email collisions during bulk CSV team imports."
        ],
        "order_index": 3,
    },
    {
        "component": "baseline",
        "version": "1.1.2",
        "release_date": "September 11, 2026",
        "status": "Production Stable",
        "tag": "Telemetry Alignment & Verification Protocol",
        "commit_hash": "prod-v1.1.2",
        "summary": "Synchronized system metadata and release tracker endpoints, ensuring 100% telemetry consistency across backend, dashboard, and browser extension.",
        "info": "SecureGPT Core Platform v1.1.2 strengthens production reliability with unified component introspection and automated deployment validation.",
        "whats_new": [
            "Component matrix synchronization endpoint reporting live health for backend, extension, and dashboard.",
            "Automated post-deployment verification hooks validating policy engine uptime.",
            "Enhanced session fingerprinting preventing device impersonation."
        ],
        "changed_functionality": [
            "Unified version headers in API responses to match SemVer check-in standard."
        ],
        "improvements": [
            "Sub-50ms latency on telemetry ingestion pipeline under high prompt concurrency."
        ],
        "problems_solved": [
            "Resolved transient version reporting mismatch between API instances."
        ],
        "order_index": 4,
    },
    {
        "component": "baseline",
        "version": "1.1.0",
        "release_date": "September 11, 2026",
        "status": "Released",
        "tag": "Enterprise Multi-Tenancy & DNS Verification",
        "commit_hash": "prod-v1.1.0",
        "summary": "Full enterprise multi-tenancy suite with organization domain DNS TXT challenge verification, department-level policy inheritance, and role-based access control.",
        "info": "SecureGPT Core Platform v1.1.0 enables organizations to establish verified tenant domains, delegate department policies, and manage enterprise DLP governance.",
        "whats_new": [
            "Domain verification gating preventing employee invitations until corporate domain ownership is confirmed via DNS TXT record challenge.",
            "Sticky Department Back-Navigation on policy page for seamless return to team view.",
            "Clear Account Type & Role Badges (Super Admin, Org Admin, Employee, Personal User) in user and admin dashboards."
        ],
        "changed_functionality": [
            "Removed live blocking keystroke listeners before Enter key press to eliminate editor lag and DOM collisions.",
            "Updated Get Started onboarding checklist to dynamically tailor steps for Org Admins vs Employees vs Personal Users.",
            "Elevated admin role checking during OAuth callback to cleanly handle all administrative roles without false redirects."
        ],
        "improvements": [
            "Smooth CSS SVG circle transition for real-time risk scores from 0% (Clean) to 100% (Critical Risk).",
            "Debounced input analysis at 600ms providing near-instant visual feedback with zero main-thread blockage.",
            "Automated account reactivation for existing users during OAuth login within 45-day grace period."
        ],
        "problems_solved": [
            "Completely eliminated typing latency and cursor displacement in contenteditable chat inputs.",
            "Fixed circular JSON reference serialization error on policy save bar in user and admin portals.",
            "Fixed existing user login rejection during Google and Microsoft OAuth flows.",
            "Prevented unverified domain admins from inviting colleagues before verifying domain control."
        ],
        "order_index": 5,
    },
    {
        "component": "baseline",
        "version": "1.0.0",
        "release_date": "September 11, 2026",
        "status": "Production Stable",
        "tag": "Baseline Production Release",
        "commit_hash": "prod-v1.0.0",
        "summary": "Initial production baseline establishing enterprise DLP interception, multi-tenant policy synchronization, audit telemetry, and centralized release tracking.",
        "info": "SecureGPT Core Platform encompasses the core backend API, client policy engine, multi-platform DLP runtime, and end-to-end data security infrastructure.",
        "whats_new": [
            "Production Release Tracker protocol with single source of truth manifest in RELEASE_TRACKER.md.",
            "Public unauthenticated health and version introspection endpoint (/api/v1/system/version).",
            "Unified enterprise telemetry pipeline logging violations, masked prompts, and blocked egress events.",
            "Multi-tenant policy engine supporting Organization Master Policies and Department Overrides.",
            "Cryptographic client fingerprinting (platform, timezone, display metrics) to prevent session hijacking."
        ],
        "changed_functionality": [
            "Standardized API route prefix to /api/v1 with centralized envelope responses across all endpoints.",
            "Replaced hardcoded policy parameters with dynamic JSON schema-backed rule configurations.",
            "Switched session management to strict SameSite cookie handling with automated refresh hooks."
        ],
        "improvements": [
            "Sub-millisecond token evaluation using precompiled regex scanners and optimized AST matching.",
            "Database connection pooling with SQLAlchemy async sessions and automatic connection recycling.",
            "Automated deployment stabilization checks in secure-gpt-update.sh."
        ],
        "problems_solved": [
            "Resolved cross-origin cookie sync dropping between dashboard frontend and backend API.",
            "Eliminated unversioned production deployments with rigorous SemVer check-in gating.",
            "Prevented accidental token leakage through strict backend error sanitization and response filtering."
        ],
        "order_index": 6,
    },

    # ── ADMIN CONSOLE RELEASES ──
    {
        "component": "admin",
        "version": "1.1.5",
        "release_date": "September 23, 2026",
        "status": "Production Stable",
        "tag": "Dynamic Release Management & Enterprise Refinements",
        "commit_hash": "admin-v1.1.5",
        "summary": "Super Admin release authoring console with live publishing controls, unified 6px border geometry, and seamless telemetry monitoring.",
        "info": "Admin Console v1.1.5 equips Super Admins with dedicated tools to manage releases, inspect multi-tenant DLP activity, and enforce zero-trust policies.",
        "whats_new": [
            "Super Admin Release Management endpoints supporting instant changelog drafts and publication.",
            "Enterprise table density controls and stroke Hugeicons across all audit views.",
            "Live system status modal querying deployed service versions and commit metadata."
        ],
        "changed_functionality": [
            "Enhanced RBAC checks on release authoring and audit export endpoints."
        ],
        "improvements": [
            "Streamlined modal backdrops with crisp 1px neutral borders and subdued shadows."
        ],
        "problems_solved": [
            "Fixed tab alignment inconsistencies across global organization governance views."
        ],
        "order_index": 1,
    },
    {
        "component": "admin",
        "version": "1.1.4",
        "release_date": "September 17, 2026",
        "status": "Production Stable",
        "tag": "Super Admin Onboarding Tours & High-Contrast Navigation",
        "commit_hash": "admin-v1.1.4",
        "summary": "Super Admin-specific interactive Joyride tour through the global control plane, high-contrast sidebar navigation tokens, and real-time cross-tenant telemetry widgets.",
        "info": "Admin Console v1.1.4 empowers platform administrators with guided navigation across all seven governance modules, high-contrast visual tokens, and instant organization switching.",
        "whats_new": [
            "Super Admin Interactive Tour walking through Organizations, Global Users, Roles, Permissions, and System Logs.",
            "Dedicated Admin Get Started page with onboarding status indicators for initial platform bootstrap.",
            "High-contrast sidebar navigation tokens meeting strict WCAG AAA standards for dark and light modes.",
            "Organization breakdown telemetry charts reporting DLP violation volume by tenant in real time.",
            "Unified component status modal inspecting backend, dashboard, and extension version alignment."
        ],
        "changed_functionality": [
            "Separated admin navigation groups: Overview, Security & Logs, Access & Governance, and Account & System.",
            "Scoped admin telemetry aggregations dynamically by organization ID with tenant boundary validation.",
            "Standardized theme token variables across all administrative stats, headers, and rate indicators."
        ],
        "improvements": [
            "Significantly improved legibility on all secondary text, timestamps, and commit hash tags in the admin console.",
            "WCAG AAA compliance across all administrative metrics, chart legends, and navigation headers.",
            "Instant responsive telemetry updates when switching between department and organization views."
        ],
        "problems_solved": [
            "Fixed faint and unreadable text on KPI rate cards and brand subtitles in light mode.",
            "Resolved data inconsistency between extension counters and admin dashboard analytics.",
            "Fixed unintended dark mode class styling applying in light mode."
        ],
        "order_index": 2,
    },
    {
        "component": "admin",
        "version": "1.1.3",
        "release_date": "September 16, 2026",
        "status": "Production Stable",
        "tag": "Enterprise Scalability & Multi-Tenant RBAC Suite",
        "commit_hash": "admin-v1.1.3",
        "summary": "Enterprise user management suite with server-side pagination, search & filter bars, floating bulk operations (bulk org assignment, bulk role updates, bulk suspension, bulk deletion), and CSV roster import & export.",
        "info": "SecureGPT Admin Console v1.1.3 scales administrative governance for 1,000+ users across all organizations with comprehensive bulk actions and audit logging.",
        "whats_new": [
            "Enterprise server-side pagination and debounced search on user management (RBAC) console.",
            "Multi-dimensional filters for dynamic security roles and account active/suspended statuses.",
            "Floating Bulk Action Bar enabling multi-select operations across hundreds of user accounts simultaneously.",
            "CSV User Roster Import supporting instant bulk account enrollment and dynamic role assignment.",
            "CSV User Export streaming full administrative user rosters with role and organization metadata.",
            "Audit logging integration recording actor, IP, timestamp, and target count for all bulk administrative operations."
        ],
        "changed_functionality": [
            "Upgraded GET /admin/users with server-side pagination, ILIKE search, and dynamic role slug filtering.",
            "Added /admin/users/bulk, /admin/users/export-csv, and /admin/users/import-csv endpoints."
        ],
        "improvements": [
            "Lightning-fast administrative user directory browsing with minimal memory overhead.",
            "Full keyboard and screen reader accessibility on all selection and bulk action dialogs."
        ],
        "problems_solved": [
            "Eliminated frontend performance bottlenecks when managing organizations with thousands of users.",
            "Fixed missing ActionBadge UI component exports in admin dashboard."
        ],
        "order_index": 3,
    },
    {
        "component": "admin",
        "version": "1.1.2",
        "release_date": "September 11, 2026",
        "status": "Production Stable",
        "tag": "Control Plane Version Parity & Telemetry Sync",
        "commit_hash": "admin-v1.1.2",
        "summary": "Synchronized administrative control plane aligning system metadata, telemetry endpoints, and component introspection with v1.1.2 core platform.",
        "info": "SecureGPT Admin Console v1.1.2 ensures uniform version telemetry and monitoring alignment across enterprise deployments.",
        "whats_new": [
            "Synchronized component metadata endpoints with Extension v1.2.1 and Dashboard v1.1.2.",
            "Refined policy state verification against updated extension interception models."
        ],
        "changed_functionality": [
            "Updated live health and component version endpoints to broadcast unified v1.1.2 ecosystem metrics."
        ],
        "improvements": [
            "Instant component matrix synchronization across all administrative inspection views."
        ],
        "problems_solved": [
            "Eliminated version drift reporting between user and administrative backend instances."
        ],
        "order_index": 4,
    },
    {
        "component": "admin",
        "version": "1.1.0",
        "release_date": "September 11, 2026",
        "status": "Released",
        "tag": "Admin RBAC & Policy Scope Expansion",
        "commit_hash": "admin-v1.1.0",
        "summary": "Admin Control Plane v1.1.0 delivers policy trigger leaderboards for top employees and departments, dynamic role modification directly in team views, and document scanning toggles.",
        "info": "SecureGPT Admin Console centralizes organizational governance, telemetry, and departmental policy overrides.",
        "whats_new": [
            "Top Employees & Departments Policy Trigger Leaderboard on Admin Dashboard.",
            "Document & File Scanning master policy toggle for administrative governance.",
            "Team Role management endpoint allowing instant role elevation and demotion.",
            "Sticky Department Back-Navigation for departmental policy editing.",
            "Clean multi-role checking in administrative OAuth callback routing."
        ],
        "changed_functionality": [
            "Enforced domain verification gate on team invitations to prevent unauthorized employee onboarding.",
            "Enhanced SaveBar handlers to eliminate synthetic React event leakage into JSON payloads."
        ],
        "improvements": [
            "Visual role status badges for Super Admin, Security Admin, and Org Admin.",
            "Real-time DNS TXT record challenge instructions with instant copy actions."
        ],
        "problems_solved": [
            "Resolved circular JSON error on policy save.",
            "Eliminated admin login loop bouncing secondary admins to user portal."
        ],
        "order_index": 5,
    },
    {
        "component": "admin",
        "version": "1.0.0",
        "release_date": "September 11, 2026",
        "status": "Production Stable",
        "tag": "Admin Control Plane v1",
        "commit_hash": "admin-v1.0.0",
        "summary": "Dedicated administrative control plane for Super Admins and Security Officers to manage enterprise policies, roles, and audit compliance.",
        "info": "SecureGPT Admin Console is the security management suite providing granular RBAC, department-level DLP controls, tenant management, and system logs.",
        "whats_new": [
            "Admin System Version inspection endpoint (/api/v1/system/version) reporting control plane builds.",
            "Role-Based Access Control (RBAC) supporting Super Admin, Security Admin, Org Admin, and Viewer permissions.",
            "Global Audit Log viewer with tamper-evident event streaming and actor tracking.",
            "Departmental policy customization allowing customized sensitivity per team (e.g. Finance vs Engineering)."
        ],
        "changed_functionality": [
            "Decoupled Admin API routing from general user endpoints for stronger security isolation.",
            "Upgraded table pagination and filtering to server-side query parameters for large audit volumes."
        ],
        "improvements": [
            "Optimized administrative dashboard metric queries with Redis-backed caching and aggregation.",
            "Polished theme system supporting seamless dark/light switching with WCAG AAA contrast compliance.",
            "Compact sidebar collapse state persistent in browser storage."
        ],
        "problems_solved": [
            "Fixed circular JSON reference crash during policy save mutations caused by synthetic React DOM event propagation.",
            "Prevented privilege escalation by strictly verifying scope claims on every administrative mutation."
        ],
        "order_index": 6,
    },

    # ── EXTENSION RELEASES ──
    {
        "component": "extension",
        "version": "1.2.3",
        "release_date": "September 24, 2026",
        "status": "Production Stable",
        "tag": "Design System Harmonization & Vector In-Page Modals",
        "commit_hash": "prod-v1.2.3-ext",
        "summary": "Synchronized design tokens with dashboard, replaced OS emojis with clean vector SVGs across all in-page modals, automated dark host detection, and enhanced touch targets and accessibility.",
        "info": "SecureGPT Chrome Extension v1.2.3 delivers complete visual and design system parity with the SecureGPT Web Dashboard, featuring unified Plus Jakarta Sans typography, WCAG AA/AAA compliant color tokens, vector iconography, and improved responsive touch ergonomics.",
        "whats_new": [
            "Harmonized design tokens: full alignment of color palette, focus rings, and Plus Jakarta Sans typography with main web application.",
            "Vector iconography overhaul: replaced OS emojis with crisp, lightweight vector SVGs across Shield Modal, Warning Banners, Radial Gauges, and Site Indicators.",
            "Automatic host dark mode detection dynamically applied to in-page Shadow DOM host overlays.",
            "Touch target ergonomics: guaranteed minimum 24px interactive boundaries across all action badges, buttons, and switches."
        ],
        "changed_functionality": [
            "Standardized core UI components (Button, Card, Badge, Toggle, StatusIndicator) using unified cn() utility.",
            "Added explicit aria-label attributes to dev mode inputs and pause protection buttons for screen reader compliance."
        ],
        "improvements": [
            "Zero host style leakage with tightened Shadow DOM styles and CSS variable scoping.",
            "Accessible high-contrast stat text across all card states in popup interface.",
            "Smooth transition animations honoring user prefers-reduced-motion preferences."
        ],
        "problems_solved": [
            "Fixed visual fragmentation between extension popup and web dashboard UI components.",
            "Resolved low-contrast text visibility on warning and block badges in dark-themed web LLM platforms."
        ],
        "order_index": 1,
    },
    {
        "component": "extension",
        "version": "1.2.2",
        "release_date": "September 17, 2026",
        "status": "Production Stable",
        "tag": "Real-time Telemetry Mirroring & Instant Policy Enforcement",
        "commit_hash": "ext-v1.2.2",
        "summary": "Bi-directional telemetry synchronization with the dashboard, instant policy update listener without page refresh, and enhanced WASM redaction pipeline.",
        "info": "SecureGPT Chrome Extension v1.2.2 delivers lightning-fast DLP inspection across ChatGPT, Claude, Gemini, Copilot, and 13 other LLM platforms with zero perceptible latency.",
        "whats_new": [
            "Live cloud telemetry sync: popup extension badge and statistics mirror dashboard analytics in real time.",
            "Instant policy hot-reloading: changes made in the dashboard policy manager apply immediately without reloading tabs.",
            "Expanded platform coverage to 17 major LLM tools including Cursor Web, DeepSeek, v0.dev, and Replit."
        ],
        "changed_functionality": [
            "Updated content script DOM interceptors to handle React 19 fiber nodes on chatgpt.com."
        ],
        "improvements": [
            "Sub-5ms regex and token matching latency using compiled WebAssembly scanner.",
            "Zero cloud data egress: all redaction and masking execution happens 100% locally in browser memory."
        ],
        "problems_solved": [
            "Fixed race condition where rapidly submitted prompts could bypass DOM inspection on slow connections."
        ],
        "order_index": 2,
    },
    {
        "component": "extension",
        "version": "1.2.1",
        "release_date": "September 11, 2026",
        "status": "Released",
        "tag": "Streamlined Radial Risk Gauge",
        "commit_hash": "ext-v1.2.1",
        "summary": "Streamlined real-time DLP experience removing intrusive popover cards and tooltips, exclusively featuring the lightweight Shadow DOM radial risk gauge.",
        "info": "SecureGPT Extension v1.2.1 provides clean, non-intrusive prompt risk visualization with zero prompt occlusion and synchronous form-submission DLP protection.",
        "whats_new": [
            "Exclusive Shadow DOM radial risk percentage gauge with zero-friction visual threat cues.",
            "Completely removed floating live warning tooltip overlays and redundant popover action bars.",
            "Lightweight memory optimization with eliminated temporary tooltip DOM trees."
        ],
        "changed_functionality": [
            "Removed live-warning-tooltip component from extension content scripts.",
            "DLP actions (mask/block) enforce cleanly on submission while the radial gauge provides passive continuous risk scoring."
        ],
        "improvements": [
            "Unobstructed typing area across all 15+ monitored generative AI platforms.",
            "Even faster DOM evaluation cycle with zero layout disruption."
        ],
        "problems_solved": [
            "Fixed floating tooltip cards covering chat input boxes and platform-native dropdown menus.",
            "Eliminated click interception issues caused by transient popover elements."
        ],
        "order_index": 3,
    },
    {
        "component": "extension",
        "version": "1.2.0",
        "release_date": "September 11, 2026",
        "status": "Released",
        "tag": "Manifest V3 Production Build",
        "commit_hash": "ext-v1.2.0",
        "summary": "High-performance browser extension providing zero-latency DOM interception, WebAssembly document parsing, and client-side DLP scanning across 15+ AI platforms.",
        "info": "SecureGPT Chrome Extension operates entirely inside the user browser, scanning and redacting sensitive data locally before it ever reaches LLM servers.",
        "whats_new": [
            "Expanded LLM coverage across 15+ major platforms including ChatGPT, Claude, Gemini, Copilot, Perplexity, Cursor, Poe, and DeepSeek.",
            "Document & attachment scanning engine powered by WebAssembly (@firecrawl/anydoc-wasm) and PDF.js.",
            "Configurable DLP Action states: ALLOW, MASK (real-time redaction), WARN, and BLOCK modal.",
            "Extension shadow DOM overlay with isolated stylesheet to eliminate host site CSS bleed.",
        ],
        "changed_functionality": [
            "Optimized input listener pipeline to eliminate typing lag prior to form submission.",
            "Switched policy cache to chrome.storage.local with periodic background sync alarms.",
        ],
        "improvements": [
            "Reduced memory footprint to under 28MB even while processing multi-page PDF documents in-browser.",
            "Faster regex evaluation using segmented rule tiers (Secrets -> PII -> Custom Org Patterns).",
            "Smoother shadow DOM animations with zero main-thread layout thrashing.",
        ],
        "problems_solved": [
            "Fixed keystroke interception interfering with Claude.ai and Perplexity autocomplete dropdowns.",
            "Solved modal z-index conflicts where host application popups covered the DLP warning shield.",
            "Fixed offline fallback policy failure when browser is disconnected from enterprise server.",
        ],
        "order_index": 4,
    },
    {
        "component": "extension",
        "version": "1.1.3",
        "release_date": "August 11, 2026",
        "status": "Released",
        "tag": "Office & Document DLP Engine",
        "commit_hash": "ext-v1.1.3",
        "summary": "Complete client-side document inspection pipeline for Office documents, spreadsheets, slides, and tabular data.",
        "info": "Introduced local document dissection and redaction before upload to ChatGPT and Claude file handlers.",
        "whats_new": [
            "Added document parsing and redaction/masking for Office documents (.docx, .xlsx, .pptx, .odt, .csv).",
            "Client-side file drop-zone interceptor catching files dragged into web LLM chat windows.",
            "Visual file inspection progress dialog showing scanning progress and detected risk count.",
        ],
        "changed_functionality": [
            "Intercepts browser File/Blob drag-and-drop and input[type=file] change events prior to upload payload generation.",
            "Allows selective entity redaction inside structured documents without corrupting file headers or archives.",
        ],
        "improvements": [
            "Asynchronous ZIP archive decompression in Web Workers preventing UI freezing during large file parsing.",
            "Optimized memory buffer deallocation after document scanning completes.",
        ],
        "problems_solved": [
            "Resolved false-negative leaks where users attached sensitive spreadsheets and confidential presentations to LLM prompts.",
            "Fixed file corruption on re-serialized .docx files after replacing PII tokens.",
            "Prevented browser tab lockups on large CSV datasets over 10MB.",
        ],
        "order_index": 5,
    },
    {
        "component": "extension",
        "version": "1.1.2",
        "release_date": "July 26, 2026",
        "status": "Released",
        "tag": "OCR & Vision Upgrade",
        "commit_hash": "ext-v1.1.2",
        "summary": "Tier 3 client-side OCR Canvas Preprocessing and quantitative accuracy testing harness.",
        "info": "Upgraded detection subsystem with high-DPI rescaling, luminance grayscaling, and adaptive binarization for image screenshots.",
        "whats_new": [
            "Tier 3 client-side OCR image preprocessing with canvas-based 2x high-DPI scaling and adaptive thresholding.",
            "Automatic rotation orientation detection (90°, 180°, 270°) for mobile and portrait screenshots.",
            "Dual-pass OCR pipeline: First pass PSM.AUTO, secondary pass PSM.SPARSE_TEXT when PII is suspected.",
        ],
        "changed_functionality": [
            "Images dragged into chat are processed through client canvas before invoking Tesseract OCR runtime.",
            "Detection confidence threshold calibration aligned with gold-standard evaluation harness.",
        ],
        "improvements": [
            "94.2% recall rate on low-contrast screenshots, dark-mode terminal captures, and code snippets.",
            "Reduced OCR preprocessing latency by 35% through direct typed-array byte manipulation.",
        ],
        "problems_solved": [
            "Fixed OCR failures on low-contrast dark mode screenshots where white-on-dark text was dropped.",
            "Prevented memory exhaustion caused by uncollected canvas contexts during rapid sequential screenshot uploads.",
        ],
        "order_index": 6,
    },
    {
        "component": "extension",
        "version": "1.1.1",
        "release_date": "July 8, 2026",
        "status": "Released",
        "tag": "Initial Public Extension",
        "commit_hash": "ext-v1.1.1",
        "summary": "Initial public release of SecureGPT browser extension built on Chrome Manifest V3.",
        "info": "First official Chrome Web Store release providing real-time client-side prompt interception for ChatGPT, Claude, and Gemini.",
        "whats_new": [
            "Manifest V3 compliant background service worker with alarms-based policy synchronization.",
            "Real-time prompt text interception on Enter key and Submit button click.",
            "Core PII detection library: Names, Email addresses, Phone numbers, Physical addresses, and Social Security Numbers.",
            "Secrets detection: AWS keys, OpenAI keys, GitHub tokens, database connection URIs, and JWTs.",
            "Extension popup menu displaying active policy sync status and local violation count.",
        ],
        "changed_functionality": [
            "Replaced deprecated Manifest V2 background page architecture with modern declarative event-driven service workers.",
            "Offscreen document lifecycle management for CPU-intensive NER and regex tasks.",
        ],
        "improvements": [
            "Sub-5ms prompt scanning overhead with zero detectable input lag during normal typing.",
            "Zero external server dependency for text inspection — complete local execution.",
        ],
        "problems_solved": [
            "Prevented accidental corporate data leaks during employee interactions with generative AI tools.",
            "Fixed Service Worker termination mid-inspection by wrapping async DLP pipelines in keep-alive ports.",
        ],
        "order_index": 7,
        "order_index": 7,
    }
]


async def seed_system_releases_if_empty(session: AsyncSession):
    """Seed or update initial system releases in system_releases table."""
    try:
        stmt = select(SystemRelease)
        res = await session.execute(stmt)
        existing_records = res.scalars().all()
        existing_map = {(r.component, r.version): r for r in existing_records}
        
        for item in INITIAL_RELEASES:
            key = (item["component"], item["version"])
            if key in existing_map:
                record = existing_map[key]
                record.release_date = item["release_date"]
                record.status = item["status"]
                record.tag = item["tag"]
                record.commit_hash = item["commit_hash"]
                record.summary = item["summary"]
                record.info = item["info"]
                record.whats_new = item["whats_new"]
                record.changed_functionality = item["changed_functionality"]
                record.improvements = item["improvements"]
                record.problems_solved = item["problems_solved"]
                record.order_index = item.get("order_index", 0)
                record.is_active = True
            else:
                release = SystemRelease(
                    component=item["component"],
                    version=item["version"],
                    release_date=item["release_date"],
                    status=item["status"],
                    tag=item["tag"],
                    commit_hash=item["commit_hash"],
                    summary=item["summary"],
                    info=item["info"],
                    whats_new=item["whats_new"],
                    changed_functionality=item["changed_functionality"],
                    improvements=item["improvements"],
                    problems_solved=item["problems_solved"],
                    order_index=item.get("order_index", 0),
                    is_active=True,
                )
                session.add(release)
        await session.commit()
        logger.info("Successfully synchronized %d system release records.", len(INITIAL_RELEASES))
    except Exception as e:
        logger.warning("Could not sync system releases: %s", str(e))
        await session.rollback()
