"use client";
// packages/dashboard/src/app/(dashboard)/event-log/page.tsx

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api/client";

interface LogEntry {
  id: string;
  action: string;
  domain: string;
  entity_types: string[];
  severities: string[];
  latency_ms: number | null;
  user_id: string | null;
  timestamp: string;
  received_at: string;
}

interface LogsResponse {
  total: number;
  items: LogEntry[];
}

const ACTION_COLORS: Record<string, React.CSSProperties> = {
  mask:   { background: "rgba(16,185,129,0.12)",  color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" },
  allow:  { background: "rgba(245,158,11,0.12)",  color: "#fbbf24", border: "1px solid rgba(245,158,11,0.25)" },
  block:  { background: "rgba(239,68,68,0.12)",   color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" },
  cancel: { background: "rgba(148,163,184,0.08)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" },
};

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH:     "#f97316",
  MEDIUM:   "#f59e0b",
  LOW:      "#22c55e",
};

export default function EventLogPage() {
  const [data, setData]     = useState<LogsResponse | null>(null);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("");
  const [action, setAction] = useState("");

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: "20" });
    if (domain) params.set("domain", domain);
    if (action) params.set("action", action);
    api.get<LogsResponse>(`/logs?${params}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, domain, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Event Log</h1>
          <p style={styles.subtitle}>All detection pipeline events across your organisation</p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/logs/export`}
          style={styles.exportBtn}
        >
          ↓ Export CSV
        </a>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          placeholder="Filter by domain…"
          value={domain}
          onChange={e => { setDomain(e.target.value); setPage(1); }}
          style={styles.filterInput}
        />
        <select
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1); }}
          style={styles.filterSelect}
        >
          <option value="">All actions</option>
          <option value="mask">Mask</option>
          <option value="allow">Allow</option>
          <option value="block">Block</option>
          <option value="cancel">Cancel</option>
        </select>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Timestamp", "Domain", "Action", "Entities", "Latency", "User"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((__, j) => (
                      <td key={j} style={styles.td}>
                        <div className="skeleton" style={{ height: 16, width: "80%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.items.map(log => (
                  <tr key={log.id} style={styles.row}>
                    <td style={styles.td}>
                      <span style={{ fontSize: 12, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                        {new Date(log.received_at).toLocaleString()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <code style={{ fontSize: 12, color: "var(--text)" }}>{log.domain}</code>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...ACTION_COLORS[log.action] }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {log.entity_types.map((et, i) => (
                          <span key={et} style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "var(--surface-2)",
                            color: "var(--text-2)",
                            fontFamily: "var(--font-mono)",
                            borderLeft: `2px solid ${SEV_COLORS[log.severities[i]] ?? "#475569"}`,
                          }}>
                            {et}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 12, color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                        {log.latency_ms != null ? `${log.latency_ms}ms` : "—"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <code style={{ fontSize: 11, color: "var(--text-3)" }}>
                        {log.user_id ? log.user_id.slice(0, 8) + "…" : "—"}
                      </code>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {!loading && data?.items.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-3)", fontSize: 14 }}>
            No events found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>
            {data?.total} total · Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
            <button style={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:      { display: "flex", flexDirection: "column", gap: 22, maxWidth: 1400 },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 },
  title:     { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" },
  subtitle:  { margin: "4px 0 0", fontSize: 14, color: "var(--text-2)" },
  exportBtn: { padding: "8px 16px", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text-2)", fontSize: 13, fontWeight: 500, textDecoration: "none", alignSelf: "center" },
  filters:   { display: "flex", gap: 10, flexWrap: "wrap" },
  filterInput:  { padding: "9px 14px", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", fontSize: 13, outline: "none", minWidth: 220, fontFamily: "inherit" },
  filterSelect: { padding: "9px 14px", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "inherit" },
  tableWrap: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th:        { padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" },
  td:        { padding: "12px 16px", borderBottom: "1px solid var(--border)", verticalAlign: "middle" },
  row:       { transition: "background 0.1s" },
  badge:     { padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 600, textTransform: "uppercase" },
  pagination:{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  pageBtn:   { padding: "7px 14px", background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text-2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
};