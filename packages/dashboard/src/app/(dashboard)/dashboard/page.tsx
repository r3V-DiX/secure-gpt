"use client";
// packages/dashboard/src/app/(dashboard)/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api/client";
import { StatCard } from "@/components/shared/StatCard";

interface DashboardStats {
    total_events: number;
    masked_count: number;
    allowed_count: number;
    blocked_count: number;
    cancelled_count: number;
    top_domains: { domain: string; count: number }[];
    top_entity_types: { type: string; count: number }[];
    events_by_day: { date: string; count: number }[];
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<DashboardStats>("/reports/dashboard?days=30")
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const greeting = getGreeting();

    return (
        <div style={styles.page} className="animate-fade-in">
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>{greeting}, {user?.full_name?.split(" ")[0] ?? "there"} 👋</h1>
                    <p style={styles.subtitle}>Here&apos;s what&apos;s happening across your organisation.</p>
                </div>
                <div style={styles.periodBadge}>Last 30 days</div>
            </div>

            {/* Stat cards */}
            {loading ? (
                <div style={styles.grid}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 110, borderRadius: "var(--r-lg)" }} />
                    ))}
                </div>
            ) : (
                <div style={styles.grid}>
                    <StatCard
                        label="Total Events"
                        value={stats?.total_events ?? 0}
                        sub="Detection pipeline events"
                        accent="blue"
                        icon={<EventIcon />}
                    />
                    <StatCard
                        label="Masked & Sent"
                        value={stats?.masked_count ?? 0}
                        sub="PII redacted before sending"
                        accent="green"
                        icon={<ShieldCheckIcon />}
                    />
                    <StatCard
                        label="Override Alerts"
                        value={stats?.allowed_count ?? 0}
                        sub="User bypassed detection"
                        accent="amber"
                        icon={<AlertIcon />}
                    />
                    <StatCard
                        label="Blocked"
                        value={stats?.blocked_count ?? 0}
                        sub="Submissions blocked by policy"
                        accent="red"
                        icon={<BlockIcon />}
                    />
                </div>
            )}

            {/* Bottom row */}
            <div style={styles.bottomRow}>
                {/* Top entity types */}
                <section style={styles.card}>
                    <h2 style={styles.cardTitle}>Top Entity Types</h2>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 32 }} />
                            ))}
                        </div>
                    ) : stats?.top_entity_types.length === 0 ? (
                        <EmptyState label="No detections yet" />
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {stats?.top_entity_types.slice(0, 8).map((item, i) => (
                                <EntityRow key={item.type} rank={i + 1} type={item.type} count={item.count} max={stats.top_entity_types[0]?.count ?? 1} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Top domains */}
                <section style={styles.card}>
                    <h2 style={styles.cardTitle}>Active Domains</h2>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton" style={{ height: 32 }} />
                            ))}
                        </div>
                    ) : stats?.top_domains.length === 0 ? (
                        <EmptyState label="No domains recorded" />
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {stats?.top_domains.slice(0, 8).map(item => (
                                <div key={item.domain} style={styles.domainRow}>
                                    <span style={styles.domainName}>{item.domain}</span>
                                    <span style={styles.domainCount}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Events over time */}
                <section style={{ ...styles.card, flex: 2 }}>
                    <h2 style={styles.cardTitle}>Events Over Time</h2>
                    {loading ? (
                        <div className="skeleton" style={{ height: 120 }} />
                    ) : stats?.events_by_day.length === 0 ? (
                        <EmptyState label="No events in this period" />
                    ) : (
                        <MiniBarChart data={stats?.events_by_day ?? []} />
                    )}
                </section>
            </div>
        </div>
    );
}

/* ── Sub-components ── */

function EntityRow({ rank, type, count, max }: { rank: number; type: string; count: number; max: number }) {
    const pct = Math.round((count / max) * 100);
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 18, fontSize: 11, color: "var(--text-3)", textAlign: "right", flexShrink: 0 }}>{rank}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text)" }}>{type}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{count}</span>
                </div>
                <div style={{ height: 4, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99, transition: "width 0.4s ease" }} />
                </div>
            </div>
        </div>
    );
}

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
    const max = Math.max(...data.map(d => d.count), 1);
    const recent = data.slice(-30);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100, paddingTop: 8 }}>
            {recent.map(d => (
                <div key={d.date} title={`${d.date}: ${d.count}`} style={{
                    flex: 1,
                    height: `${Math.max(4, (d.count / max) * 100)}%`,
                    background: "var(--accent-dim)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    borderRadius: "3px 3px 0 0",
                    minWidth: 4,
                    transition: "background 0.15s",
                    cursor: "default",
                }} />
            ))}
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            {label}
        </div>
    );
}

/* ── Helpers ── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

/* ── Icons ── */
function EventIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>; }
function ShieldCheckIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>; }
function AlertIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><triangle points="10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>; }
function BlockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>; }

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
    page: { display: "flex", flexDirection: "column", gap: 28, maxWidth: 1400 },
    header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 },
    title: { margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--text)" },
    subtitle: { margin: "4px 0 0", fontSize: 14, color: "var(--text-2)" },
    periodBadge: {
        padding: "6px 14px",
        background: "var(--surface)",
        border: "1px solid var(--border-2)",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-2)",
        alignSelf: "center",
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 },
    bottomRow: { display: "flex", gap: 16, flexWrap: "wrap" },
    card: {
        flex: 1,
        minWidth: 220,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: "20px 22px",
    },
    cardTitle: { margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.06em" },
    domainRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" },
    domainName: { fontSize: 13, color: "var(--text)", fontFamily: "var(--font-mono)" },
    domainCount: { fontSize: 12, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" },
};