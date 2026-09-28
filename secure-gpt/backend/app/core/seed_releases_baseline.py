# Baseline releases dataset

BASELINE_RELEASES = [
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
    }
]
