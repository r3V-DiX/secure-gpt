"use client";
// packages/dashboard/src/components/layout/Sidebar.tsx

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, type UserRole } from "@/contexts/auth-context";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles: UserRole[];
}

const NAV: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: <GridIcon />,
        roles: ["super_admin", "security_admin", "auditor", "user"],
    },
    {
        label: "Event Log",
        href: "/dashboard/event-log",
        icon: <LogIcon />,
        roles: ["super_admin", "security_admin", "auditor"],
    },
    {
        label: "Alerts",
        href: "/dashboard/alerts",
        icon: <BellIcon />,
        roles: ["super_admin", "security_admin"],
    },
    {
        label: "Users",
        href: "/dashboard/users",
        icon: <UsersIcon />,
        roles: ["super_admin", "security_admin"],
    },
    {
        label: "Devices",
        href: "/dashboard/devices",
        icon: <DeviceIcon />,
        roles: ["super_admin", "security_admin"],
    },
    {
        label: "Policy",
        href: "/dashboard/policy",
        icon: <PolicyIcon />,
        roles: ["super_admin", "security_admin"],
    },
    {
        label: "Reports",
        href: "/dashboard/reports",
        icon: <ReportIcon />,
        roles: ["super_admin", "security_admin", "auditor"],
    },
    {
        label: "Organisations",
        href: "/dashboard/organisations",
        icon: <OrgIcon />,
        roles: ["super_admin"],
    },
];

export function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const visible = NAV.filter(item => item.roles.includes(user.role));

    return (
        <aside style={styles.aside}>
            {/* Logo */}
            <div style={styles.logo}>
                <div style={styles.logoIcon}><ShieldIcon /></div>
                <span style={styles.logoText}>DLP Shield</span>
            </div>

            {/* Role badge */}
            <div style={styles.roleBadge}>
                <span style={{ ...styles.rolePill, ...rolePillColor(user.role) }}>
                    {formatRole(user.role)}
                </span>
            </div>

            {/* Nav */}
            <nav style={styles.nav}>
                {visible.map(item => {
                    const active = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href} style={{
                            ...styles.navItem,
                            ...(active ? styles.navItemActive : {}),
                        }}>
                            <span style={{ ...styles.navIcon, ...(active ? styles.navIconActive : {}) }}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div style={styles.userSection}>
                <div style={styles.userRow}>
                    <div style={styles.avatar}>
                        {user.avatar_url
                            ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                            : <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                                {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                            </span>
                        }
                    </div>
                    <div style={styles.userInfo}>
                        <span style={styles.userName}>{user.full_name ?? "User"}</span>
                        <span style={styles.userEmail}>{user.email}</span>
                    </div>
                </div>
                <button style={styles.logoutBtn} onClick={logout}>
                    <LogoutIcon />
                </button>
            </div>
        </aside>
    );
}

function formatRole(role: UserRole) {
    return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function rolePillColor(role: UserRole): React.CSSProperties {
    const map: Record<UserRole, React.CSSProperties> = {
        super_admin: { background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" },
        security_admin: { background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.3)" },
        auditor: { background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" },
        user: { background: "rgba(148,163,184,0.1)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" },
    };
    return map[role];
}

const styles: Record<string, React.CSSProperties> = {
    aside: {
        width: 240,
        minHeight: "100vh",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        position: "sticky",
        top: 0,
        flexShrink: 0,
    },
    logo: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "4px 8px 20px",
        borderBottom: "1px solid var(--border)",
        marginBottom: 12,
    },
    logoIcon: {
        width: 32, height: 32,
        background: "var(--accent-dim)",
        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: "var(--r-sm)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--accent)",
    },
    logoText: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" },
    roleBadge: { padding: "6px 8px 14px" },
    rolePill: {
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
    },
    nav: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: "var(--r-sm)",
        color: "var(--text-2)",
        fontSize: 13.5,
        fontWeight: 500,
        textDecoration: "none",
        transition: "background 0.12s, color 0.12s",
    },
    navItemActive: {
        background: "var(--accent-dim)",
        color: "var(--text)",
    },
    navIcon: { color: "var(--text-3)", display: "flex" },
    navIconActive: { color: "var(--accent)" },
    userSection: {
        marginTop: "auto",
        paddingTop: 16,
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    userRow: { flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
    avatar: {
        width: 32, height: 32, borderRadius: "50%",
        background: "var(--accent-dim)",
        border: "1px solid rgba(59,130,246,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, overflow: "hidden",
    },
    userInfo: { display: "flex", flexDirection: "column", minWidth: 0 },
    userName: { fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    userEmail: { fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    logoutBtn: {
        width: 30, height: 30,
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-sm)",
        color: "var(--text-3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "color 0.12s, border-color 0.12s",
    },
};

/* ── Icons ── */
function ShieldIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>; }
function GridIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>; }
function LogIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>; }
function BellIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }
function UsersIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function DeviceIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>; }
function PolicyIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>; }
function ReportIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function OrgIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>; }
function LogoutIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>; }