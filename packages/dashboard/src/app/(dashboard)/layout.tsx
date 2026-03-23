"use client";
// packages/dashboard/src/app/(dashboard)/layout.tsx

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg)",
            }}>
                <div style={{
                    width: 36, height: 36,
                    border: "3px solid rgba(59,130,246,0.2)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
            <Sidebar />
            <main style={{ flex: 1, minWidth: 0, padding: "28px 32px", overflowY: "auto" }}>
                {children}
            </main>
        </div>
    );
}