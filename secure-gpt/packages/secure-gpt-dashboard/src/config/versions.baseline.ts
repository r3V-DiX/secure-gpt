// packages/secure-gpt-dashboard/src/config/versions.baseline.ts
import type { VersionItem } from './versions.types'

export const BASELINE_VERSIONS: VersionItem[] = [
  {
    version: '1.1.5',
    date: 'September 23, 2026',
    status: 'Production Stable',
    tag: 'Dynamic Database-Backed Changelog & Refined Developer UI',
    commit: 'prod-v1.1.5',
    summary: 'Decoupled static version strings into dynamic PostgreSQL release records with single source of truth propagation, unified design-token typography, and zero-downtime changelog publishing.',
    info: 'SecureGPT Core Platform v1.1.5 transitions the versioning engine to a full PostgreSQL-backed model with live client synchronization, Super Admin CRUD endpoints, and refined 1px border architecture across all enterprise console surfaces.',
    whatsNew: [
      'Dynamic single-source-of-truth version propagation across Navbar, Footer, Sidebar, and Version Modals.',
      'PostgreSQL-backed SystemRelease model enabling instant changelog publishing without redeployments.',
      'Unified Hugeicons iconography engine with 1.5px stroke precision across all data tables and policy cards.',
      'Refined 6px container geometry removing artificial shadows and bloated card radiuses.',
    ],
    changedFunctionality: [
      'Refactored /versions page to stream changelog entries dynamically via /api/v1/system/releases.',
      'Replaced static JSON manifests with reactive React useSystemVersion context provider.',
    ],
    improvements: [
      'Instant client-side fallback ensuring 100% uptime for version badges even during database maintenance.',
      'Tightened data density across audit tables, platform monitor grids, and modal dialogs.',
    ],
    problemsSolved: [
      'Eliminated hardcoded version string disparity between backend, extension, and dashboard.',
      'Resolved inconsistent border radius tokens across auth and settings dialogs.',
    ],
  },
  {
    version: '1.1.4',
    date: 'September 17, 2026',
    status: 'Production Stable',
    tag: 'Interactive Role Tours & High-Contrast Visual Engine',
    commit: 'prod-v1.1.4',
    summary: 'Modular role-based onboarding tours & Get Started workflows across Super Admin, Org Admin, Employee, and Personal User personas, alongside enterprise-grade typography contrast enhancements and real-time extension telemetry synchronization.',
    info: 'SecureGPT Core Platform v1.1.4 delivers modular role-specific guided onboarding with React Joyride, high-contrast accessible design tokens across light and dark themes, and live bidirectional telemetry synchronization.',
    whatsNew: [
      'Modular role-specific interactive Joyride tours customized dynamically for Super Admin, Org Admin, Employee, and Personal User accounts.',
      'Dedicated Get Started onboarding checklists with real-time status tracking tailored to user roles.',
      'High-contrast typography and design token upgrades ensuring strict WCAG AAA contrast across all KPI cards, sidebars, and empty states.',
      'Live cloud telemetry sync in Chrome extension popup mirroring dashboard analytics in real time.',
      'Enterprise rate metrics visualization with color-coded progress indicators for Allow, Block, and Mask efficiency.',
    ],
    changedFunctionality: [
      'Refactored onboarding tour configs into modular role-specific definitions without single-file bloat.',
      'Updated extension log ingestion to automatically capture and associate organization tenancy metadata.',
      'Scoped dashboard telemetry queries to aggregate multi-tenant user and department activity accurately.',
    ],
    improvements: [
      'Crystal-clear readability on all metric numbers and subtitle elements in both light and dark modes.',
      'Instant responsive state updates when toggling protection or changing organization scopes.',
    ],
    problemsSolved: [
      'Fixed faint and low-opacity subtitle text on sidebar brand headers and version tags.',
      'Resolved metric disparity between extension session counters and dashboard analytics.',
      'Prevented unwanted dark mode styles from applying when light theme is active.',
    ],
  },
  {
    version: '1.1.3',
    date: 'September 16, 2026',
    status: 'Production Stable',
    tag: 'Enterprise Scale & Bulk Operations Suite',
    commit: 'prod-v1.1.3',
    summary: 'Enterprise-grade employee roster management scaled for 1,000+ employees with server-side pagination, live debounced search and filtering, floating bulk operations toolbar, and CSV roster import & export.',
    info: 'SecureGPT Core Platform v1.1.3 unlocks enterprise scalability with streamlined roster controls, bulk department assignments, role switching, and one-click CSV roster import.',
    whatsNew: [
      'Server-side paginated team and user rosters supporting organizations with 1,000+ employees.',
      'Live debounced search (by email and name) and multi-dimensional filters for departments and roles.',
      'Floating Bulk Operations toolbar supporting batch department assignment, batch role updates, batch suspension, and batch hard deletion.',
      'Full CSV Roster Import modal with drag-and-drop file upload, downloadable template, and detailed row-by-row error validation.',
      'Direct CSV Roster Export streaming filtered employee datasets with complete security metadata.',
      'ActionBadge component integration and robust React 19 forwardRef icon rendering in EmptyState.',
    ],
    changedFunctionality: [
      'Replaced client-side employee array slicing with high-performance SQL server-side pagination (LIMIT/OFFSET).',
      'Unified single-click and batch multi-select state management with page-level and global selection indicators.',
    ],
    improvements: [
      'Zero layout shift or browser stutter during rapid search filtering on large rosters.',
      'Seamless multi-select batch status changes with live toast confirmation feedback.',
    ],
    problemsSolved: [
      'Fixed blank page on direct URL navigation to /team when managing 500+ employees.',
      'Resolved missing ActionBadge import error during Next.js production builds.',
    ],
  },
  {
    version: '1.1.2',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Telemetry Alignment & Verification Protocol',
    commit: 'prod-v1.1.2',
    summary: 'Synchronized system metadata and release tracker endpoints, ensuring 100% telemetry consistency across backend, dashboard, and browser extension.',
    info: 'SecureGPT Core Platform v1.1.2 strengthens production reliability with unified component introspection and automated deployment validation.',
    whatsNew: [
      'Component matrix synchronization endpoint reporting live health for backend, extension, and dashboard.',
      'Automated post-deployment verification hooks validating policy engine uptime.',
      'Enhanced session fingerprinting preventing device impersonation.',
    ],
    changedFunctionality: [
      'Unified version headers in API responses to match SemVer check-in standard.',
    ],
    improvements: [
      'Sub-50ms latency on telemetry ingestion pipeline under high prompt concurrency.',
    ],
    problemsSolved: [
      'Resolved transient version reporting mismatch between API instances.',
    ],
  },
  {
    version: '1.1.0',
    date: 'September 11, 2026',
    status: 'Released',
    tag: 'Enterprise Multi-Tenancy & DNS Verification',
    commit: 'prod-v1.1.0',
    summary: 'Full enterprise multi-tenancy suite with organization domain DNS TXT challenge verification, department-level policy inheritance, and role-based access control.',
    info: 'SecureGPT Core Platform v1.1.0 enables organizations to establish verified tenant domains, delegate department policies, and manage enterprise DLP governance.',
    whatsNew: [
      'Domain verification gating preventing employee invitations until corporate domain ownership is confirmed via DNS TXT record challenge.',
      'Sticky Department Back-Navigation on policy page for seamless return to team view.',
      'Clear Account Type & Role Badges (Super Admin, Org Admin, Employee, Personal User) in user and admin dashboards.',
    ],
    changedFunctionality: [
      'Removed live blocking keystroke listeners before Enter key press to eliminate editor lag and DOM collisions.',
      'Updated Get Started onboarding checklist to dynamically tailor steps for Org Admins vs Employees vs Personal Users.',
      'Elevated admin role checking during OAuth callback to cleanly handle all administrative roles without false redirects.',
    ],
    improvements: [
      'Smooth CSS SVG circle transition for real-time risk scores from 0% (Clean) to 100% (Critical Risk).',
      'Debounced input analysis at 600ms providing near-instant visual feedback with zero main-thread blockage.',
      'Automated account reactivation for existing users during OAuth login within 45-day grace period.',
    ],
    problemsSolved: [
      'Completely eliminated typing latency and cursor displacement in contenteditable chat inputs.',
      'Fixed circular JSON reference serialization error on policy save bar in user and admin portals.',
      'Fixed existing user login rejection during Google and Microsoft OAuth flows.',
      'Prevented unverified domain admins from inviting colleagues before verifying domain control.',
    ],
  },
  {
    version: '1.0.0',
    date: 'September 11, 2026',
    status: 'Production Stable',
    tag: 'Baseline Production Release',
    commit: 'prod-v1.0.0',
    summary: 'Initial production baseline establishing enterprise DLP interception, multi-tenant policy synchronization, audit telemetry, and centralized release tracking.',
    info: 'SecureGPT Core Platform encompasses the core backend API, client policy engine, multi-platform DLP runtime, and end-to-end data security infrastructure.',
    whatsNew: [
      'Production Release Tracker protocol with single source of truth manifest in RELEASE_TRACKER.md.',
      'Public unauthenticated health and version introspection endpoint (/api/v1/system/version).',
      'Unified enterprise telemetry pipeline logging violations, masked prompts, and blocked egress events.',
      'Multi-tenant policy engine supporting Organization Master Policies and Department Overrides.',
      'Cryptographic client fingerprinting (platform, timezone, display metrics) to prevent session hijacking.',
    ],
    changedFunctionality: [
      'Standardized API route prefix to /api/v1 with centralized envelope responses across all endpoints.',
      'Replaced hardcoded policy parameters with dynamic JSON schema-backed rule configurations.',
      'Switched session management to strict SameSite cookie handling with automated refresh hooks.',
    ],
    improvements: [
      'Sub-millisecond token evaluation using precompiled regex scanners and optimized AST matching.',
      'Database connection pooling with SQLAlchemy async sessions and automatic connection recycling.',
      'Automated deployment stabilization checks in secure-gpt-update.sh.',
    ],
    problemsSolved: [
      'Resolved cross-origin cookie sync dropping between dashboard frontend and backend API.',
      'Eliminated unversioned production deployments with rigorous SemVer check-in gating.',
      'Prevented accidental token leakage through strict backend error sanitization and response filtering.',
    ],
  },
]
