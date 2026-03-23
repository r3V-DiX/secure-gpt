"use client";
// packages/dashboard/src/app/(dashboard)/users/page.tsx

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";

interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    is_high_risk: boolean;
    org_id: string | null;
    created_at: string;
    last_login_at: string | null;
}

interface UsersResponse { total: number; items: User[] }

const ROLE_STYLES: Record<string, React.CSSProperties> = {
    super_admin: { color: "#a78bfa", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" },
    security_admin: { color: "#60a5fa", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" },
    auditor: { color: "#34d399", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" },
    user: { color: "#94a3b8", background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.2)" },
};

export default function UsersPage() {
    const [data, setData] = useState<UsersResponse | null>(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [highRisk, setHighRisk] = useState<boolean | undefined>(undefined);

    const fetch = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), page_size: "20" });
        if (highRisk !== undefined) params.set("is_high_risk", String(highRisk));
        api.get<UsersResponse>(`/users?${params}`)
            .then(setData).catch(console.error).finally(() => setLoading(false));
    }, [page, highRisk]);

    useEffect(() => { fetch(); }, [fetch]);

    const totalPages = data ? Math.ceil(data.total / 20) : 1;

    return (
        <div style={s.page} className="animate-fade-in">
            <div style={s.header}>
                <div>
                    <h1 style={s.title}>Users</h1>
                    <p style={s.sub}>Manage users and their access levels</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        style={{ ...s.filterBtn, ...(highRisk === true ? s.filterBtnActive : {}) }}
                        onClick={() => setHighRisk(highRisk === true ? undefined : true)}
                    >
                        ⚠ High Risk Only
                    </button>
                </div>
            </div>

            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr>
                            {["User", "Role", "Status", "Last Login", ""].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? [...Array(8)].map((_, i) => (
                                <tr key={i}>{[...Array(5)].map((__, j) => (
                                    <td key={j} style={s.td}><div className="skeleton" style={{ height: 16 }} /></td>
                                ))}</tr>
                            ))
                            : data?.items.map(user => (
                                <tr key={user.id} style={s.row}>
                                    <td style={s.td}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={s.avatar}>
                                                {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                                                    {user.full_name ?? "—"}
                                                    {user.is_high_risk && <span style={s.riskBadge}>High Risk</span>}
                                                </div>
                                                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ ...s.badge, ...ROLE_STYLES[user.role] }}>
                                            {user.role.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ fontSize: 12, color: user.is_active ? "var(--green)" : "var(--text-3)" }}>
                                            {user.is_active ? "● Active" : "○ Inactive"}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        <Link href={`/dashboard/users/${user.id}`} style={s.viewLink}>View →</Link>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                {!loading && data?.items.length === 0 && (
                    <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>No users found</div>
                )}
            </div>

            {totalPages > 1 && (
                <div style={s.pagination}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>{data?.total} users · Page {page}/{totalPages}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button style={s.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                        <button style={s.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const s: Record<string, React.CSSProperties> = {
    page: { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1200 },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 },
    title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" },
    sub: { margin: "4px 0 0", fontSize: 14, color: "var(--text-2)" },
    filterBtn: { padding: "8px 14px", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text-2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
    filterBtnActive: { background: "var(--amber-dim)", border: "1px solid rgba(245,158,11,0.3)", color: "var(--amber)" },
    tableWrap: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" },
    td: { padding: "13px 16px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" },
    row: { transition: "background 0.1s" },
    avatar: { width: 32, height: 32, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0 },
    badge: { padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 600 },
    riskBadge: { padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.25)" },
    viewLink: { fontSize: 12, color: "var(--accent)", textDecoration: "none", fontWeight: 500 },
    pagination: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
    pageBtn: { padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text-2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
};