"use client";
// packages/dashboard/src/app/(auth)/login/page.tsx

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = `${API_URL}/api/v1/auth/google`;
  }

  return (
    <div style={styles.root}>
      {/* Background grid */}
      <div style={styles.grid} aria-hidden />

      {/* Glow blob */}
      <div style={styles.blob} aria-hidden />

      <div style={styles.card} className="animate-fade-in">
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>
            <ShieldIcon />
          </div>
          <span style={styles.logoText}>DLP Shield</span>
        </div>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your security dashboard</p>

        {/* Google button */}
        <button style={styles.googleBtn} onClick={handleGoogle} type="button">
          <GoogleIcon />
          Continue with Google
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or sign in with email</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={styles.input}
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Spinner /> : "Sign in"}
          </button>
        </form>

        <p style={styles.footer}>
          Protected by end-to-end encryption · All PII stays on-device
        </p>
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: 16, height: 16,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "48px 48px",
    maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
  },
  blob: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 420,
    background: "var(--surface)",
    border: "1px solid var(--border-2)",
    borderRadius: "var(--r-xl)",
    padding: "36px 32px 28px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.6)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: "var(--r-md)",
    background: "var(--accent-dim)",
    border: "1px solid rgba(59,130,246,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--accent)",
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: "-0.4px",
    color: "var(--text)",
  },
  heading: {
    margin: "0 0 6px",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    color: "var(--text)",
  },
  sub: {
    margin: "0 0 24px",
    fontSize: 14,
    color: "var(--text-2)",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "11px 16px",
    background: "var(--surface-2)",
    border: "1px solid var(--border-2)",
    borderRadius: "var(--r-md)",
    color: "var(--text)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--border)",
  },
  dividerText: {
    fontSize: 12,
    color: "var(--text-3)",
    whiteSpace: "nowrap",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-2)",
  },
  input: {
    padding: "10px 14px",
    background: "var(--bg-2)",
    border: "1px solid var(--border-2)",
    borderRadius: "var(--r-md)",
    color: "var(--text)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
  },
  error: {
    margin: 0,
    padding: "10px 14px",
    background: "var(--red-dim)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "var(--r-sm)",
    color: "var(--red)",
    fontSize: 13,
  },
  submitBtn: {
    marginTop: 4,
    padding: "11px 16px",
    background: "var(--accent)",
    border: "none",
    borderRadius: "var(--r-md)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity 0.15s",
  },
  footer: {
    marginTop: 20,
    fontSize: 11,
    color: "var(--text-3)",
    textAlign: "center",
    lineHeight: 1.6,
  },
};