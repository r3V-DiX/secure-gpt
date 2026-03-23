"use client";
// packages/dashboard/src/app/(auth)/callback/page.tsx
// Backend redirects here after Google OAuth — just refresh auth state and go.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function CallbackPage() {
  const { refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    refresh().then(() => router.replace("/dashboard"));
  }, [refresh, router]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      gap: 16,
    }}>
      <div style={{
        width: 40, height: 40,
        border: "3px solid rgba(59,130,246,0.2)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "var(--text-2)", fontSize: 14 }}>Signing you in…</p>
    </div>
  );
}