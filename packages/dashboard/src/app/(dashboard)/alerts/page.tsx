"use client";
// packages/dashboard/src/app/(dashboard)/alerts/page.tsx

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";

interface Alert {
    user_id: string | null;
    domain: string;
    action: string;
    entity_types: string[];
    severities: string[];
    timestamp: string;
    log_id: string;
}

interface AlertsResponse { total: number; items: Alert[] }

const SEV_COLORS: Record<string, string> = {
    CRITICAL: "#ef4444",
    HIGH: "#f97316",
    MEDIUM: "#f59e0b",
    LOW: "#22c55e",
};

export default function AlertsPage() {
    const [data, setData] = useState<AlertsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setLoading(true);
        api.get<AlertsResponse>(`/alerts?page=${page}&page_size=20`)
            .then(setData).catch(console.error).finally(() => setLoading(false));
    }, [page]);

    const maxSev = (sevs: string[]) => {
        const order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
        return order.find(s => sevs.includes(s)) ?? "LOW";
    };

    const totalPages = data ? Math.ceil(data.total / 20) : 1;

    return (
        <div style={s.page} className="animate-fade-in">
            <div>
                <h1 style={s.title}>Alerts</h1>
                <p style={s.sub}>Override events where users bypassed or were blocked by policy</p>
            </div>

            <div style={s.tableWrap}>
                <table style={s.table}>
                    <thead>
                        <tr>
                            {["Severity", "Domain", "Action", "Entity Types", "User", "Time"].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? [...Array(8)].map((_, i) => (
                                <tr key={i}>{[...Array(6)].map((__, j) => (
                                    <td key={j} style={s.td}><div className="skeleton" style={{ height: 16 }} /></td>
                                ))}</tr>
                            ))
                            : data?.items.map(alert => {
                                const top = maxSev(alert.severities);
                                return (
                                    <tr key={alert.log_id} style={s.row}>
                                        <td style={s.td}>
                                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: SEV_COLORS[top] }}>
                                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEV_COLORS[top], flexShrink: 0, boxShadow: `0 0 6px ${SEV_COLORS[top]}` }} />
                                                {top}
                                            </span>
                                        </td>
                                        <td style={s.td}><code style={{ fontSize: 12 }}>{alert.domain}</code></td>
                                        <td style={s.td}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: alert.action === "allow" ? "var(--amber)" : "var(--red)", textTransform: "uppercase" }}>
                                                {alert.action}
                                            </span>
                                        </td>
                                        <td style={s.td}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                                {alert.entity_types.map(et => (
                                                    <span key={et} style={s.typeBadge}>{et}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={s.td}>
                                            <code style={{ fontSize: 11, color: "var(--text-3)" }}>
                                                {alert.user_id ? alert.user_id.slice(0, 8) + "…" : "—"}
                                            </code>
                                        </td>
                                        <td style={s.td}>
                                            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        }
                    </tbody>
                </table>
                {!loading && data?.items.length === 0 && (
                    <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>
                        No alerts — great job! 🎉
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div style={s.pagination}>
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>{data?.total} alerts</span>
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
    title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" },
    sub: { margin: "4px 0 0", fontSize: 14, color: "var(--text-2)" },
    tableWrap: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" },
    td: { padding: "13px 16px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" },
    row: { transition: "background 0.1s" },
    typeBadge: { fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "var(--surface-2)", color: "var(--text-2)", fontFamily: "var(--font-mono)" },
    pagination: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    pageBtn: { padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text-2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
};