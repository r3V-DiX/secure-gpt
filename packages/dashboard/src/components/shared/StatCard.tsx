"use client";
// packages/dashboard/src/components/shared/StatCard.tsx

interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    accent?: "blue" | "green" | "amber" | "red" | "purple";
    icon?: React.ReactNode;
}

const accentMap = {
    blue: { color: "var(--accent)", dim: "var(--accent-dim)", border: "rgba(59,130,246,0.25)" },
    green: { color: "var(--green)", dim: "var(--green-dim)", border: "rgba(16,185,129,0.25)" },
    amber: { color: "var(--amber)", dim: "var(--amber-dim)", border: "rgba(245,158,11,0.25)" },
    red: { color: "var(--red)", dim: "var(--red-dim)", border: "rgba(239,68,68,0.25)" },
    purple: { color: "var(--purple)", dim: "var(--purple-dim)", border: "rgba(139,92,246,0.25)" },
};

export function StatCard({ label, value, sub, accent = "blue", icon }: StatCardProps) {
    const a = accentMap[accent];
    return (
        <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            transition: "border-color 0.15s",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {label}
                </span>
                {icon && (
                    <div style={{
                        width: 30, height: 30,
                        background: a.dim,
                        border: `1px solid ${a.border}`,
                        borderRadius: "var(--r-sm)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: a.color,
                    }}>
                        {icon}
                    </div>
                )}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px", lineHeight: 1 }}>
                {value}
            </div>
            {sub && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</div>}
        </div>
    );
}