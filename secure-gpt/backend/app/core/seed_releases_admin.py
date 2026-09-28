# Admin releases dataset

ADMIN_RELEASES = [
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
    }
]
