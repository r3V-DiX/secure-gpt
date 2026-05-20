'use client'
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';
import { Shield, Lock, Eye, Server, FileText, Mail, AlertTriangle, Users, RefreshCw } from 'lucide-react';

export default function PrivacyPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-poppins), Poppins, system-ui, sans-serif' }}>

      {/* ── Navigation ── */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md"
           style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden" style={{ background: 'var(--brand-dark)' }}>
              <img src="/rivedix_logo.png" alt="SecureGPT" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Secure<span style={{ color: 'var(--accent)' }}>GPT</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <Link href="/dashboard">
                <Button variant="ghost" className="text-sm font-semibold">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" className="text-sm font-semibold">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Page header */}
          <div className="mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 border"
                 style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
              <Lock size={11} />
              Legal
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Privacy Policy</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Effective date: 1 May 2025 &nbsp;·&nbsp; Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <article className="rounded-2xl border animate-fade-in" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>

            {/* Intro callout */}
            <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-4 p-4 rounded-xl border" style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}>
                <Shield size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  SecureGPT is built on a <strong>privacy-first, local-first</strong> principle. Sensitive data you type is detected and masked entirely inside your browser — raw PII, credentials, or confidential text <strong>never leaves your device</strong> and never reaches our servers.
                </p>
              </div>
            </div>

            <div className="px-8 py-8 space-y-10" style={{ color: 'var(--text-secondary)' }}>

              {/* 1. Who we are */}
              <Section icon={<Users size={16} style={{ color: 'var(--accent)' }} />} title="1. Who We Are">
                <p>SecureGPT is a product developed and operated by <strong>Rivedix</strong> ("we", "us", "our"). We provide a browser-native Data Loss Prevention (DLP) extension and an accompanying dashboard to help individuals and enterprise teams prevent sensitive data from being shared with external AI language model providers.</p>
                <p className="mt-3">For privacy enquiries, contact us at: <a href="mailto:info@rivedix.com" style={{ color: 'var(--accent)' }}>info@rivedix.com</a></p>
              </Section>

              {/* 2. What data we collect */}
              <Section icon={<Eye size={16} style={{ color: 'var(--accent)' }} />} title="2. What Data We Collect">
                <p className="mb-4">We collect the minimum data necessary to operate the service. Here is a precise breakdown:</p>
                <div className="space-y-4">
                  <DataRow
                    label="Account information"
                    detail="Work email address, display name, and organisation name provided during sign-up. Used solely for authentication and account management."
                    collected={true}
                  />
                  <DataRow
                    label="Detection metadata"
                    detail="Anonymised event logs: the type of sensitive data detected (e.g. 'API Key'), the platform where it was detected (e.g. 'ChatGPT'), and the policy action taken (e.g. 'Masked'). This data never includes the actual sensitive value."
                    collected={true}
                  />
                  <DataRow
                    label="Extension usage telemetry"
                    detail="Aggregate, anonymised signals such as whether the extension is active or paused. No prompt content or page content is ever captured."
                    collected={true}
                  />
                  <DataRow
                    label="Raw prompt content"
                    detail="We do not collect, transmit, or store the text of any message you type. All prompt inspection happens locally in your browser tab."
                    collected={false}
                  />
                  <DataRow
                    label="Sensitive data values"
                    detail="We do not collect the actual PII, credentials, financial data, or any other sensitive entities detected. Only the category and count are logged."
                    collected={false}
                  />
                </div>
              </Section>

              {/* 3. How we use it */}
              <Section icon={<Server size={16} style={{ color: 'var(--accent)' }} />} title="3. How We Use Your Data">
                <ul className="space-y-2.5 text-sm">
                  {[
                    'To authenticate your account and provide access to the dashboard.',
                    'To generate compliance audit logs visible to your organisation\'s administrator.',
                    'To improve detection accuracy using fully anonymised, aggregated pattern data — never linked to individuals.',
                    'To send service-critical communications (e.g. security alerts, policy changes). We do not send marketing emails without explicit consent.',
                    'To analyse product usage at an aggregate level to improve the extension\'s performance.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* 4. Data storage */}
              <Section icon={<Server size={16} style={{ color: 'var(--accent)' }} />} title="4. Data Storage and Retention">
                <p>Account data and detection metadata are stored on secure servers within the European Union (EU). We retain detection logs for up to <strong>90 days</strong> on paid plans and <strong>7 days</strong> on the free tier, after which they are automatically deleted. Account data is retained for the duration of your subscription and deleted within 30 days of account closure upon request.</p>
                <p className="mt-3">We implement AES-256 encryption at rest and TLS 1.3 in transit for all data we do store.</p>
              </Section>

              {/* 5. Sharing */}
              <Section icon={<Users size={16} style={{ color: 'var(--accent)' }} />} title="5. Data Sharing and Third Parties">
                <p className="mb-3">We do not sell your data. We do not share your data with third parties for advertising purposes. Limited sharing occurs only in these circumstances:</p>
                <ul className="space-y-2.5 text-sm">
                  {[
                    'Your organisation\'s designated administrator can view detection event logs for audit and compliance purposes.',
                    'We use trusted sub-processors (cloud infrastructure, authentication providers) who are bound by data processing agreements under GDPR Article 28.',
                    'We may disclose data if required by law, court order, or to protect the rights and safety of our users.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* 6. Your rights */}
              <Section icon={<FileText size={16} style={{ color: 'var(--accent)' }} />} title="6. Your Rights">
                <p className="mb-3">Under GDPR and applicable data protection laws, you have the right to:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    ['Access', 'Request a copy of all personal data we hold about you.'],
                    ['Correction', 'Ask us to correct inaccurate or incomplete data.'],
                    ['Erasure', 'Request deletion of your personal data ("right to be forgotten").'],
                    ['Portability', 'Receive your data in a structured, machine-readable format.'],
                    ['Objection', 'Object to processing based on legitimate interests.'],
                    ['Restriction', 'Ask us to limit processing in certain circumstances.'],
                  ].map(([right, desc]) => (
                    <div key={right} className="p-3 rounded-xl border text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
                      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{right}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm">To exercise any of these rights, email <a href="mailto:info@rivedix.com" style={{ color: 'var(--accent)' }}>info@rivedix.com</a>. We will respond within 30 days.</p>
              </Section>

              {/* 7. Cookies */}
              <Section icon={<FileText size={16} style={{ color: 'var(--accent)' }} />} title="7. Cookies">
                <p>The SecureGPT dashboard uses strictly necessary session cookies for authentication. We do not use tracking cookies, advertising cookies, or third-party analytics cookies. No cookie consent banner is required as we use only essential cookies.</p>
              </Section>

              {/* 8. Security */}
              <Section icon={<Lock size={16} style={{ color: 'var(--accent)' }} />} title="8. Security">
                <p>Security is our core product, and we apply the same rigour to our own infrastructure. Measures include: TLS 1.3 for data in transit, AES-256 encryption at rest, strict access controls and audit logging on our systems, and regular security reviews. We operate a responsible disclosure policy — if you discover a vulnerability, please report it to <a href="mailto:info@rivedix.com" style={{ color: 'var(--accent)' }}>info@rivedix.com</a>.</p>
              </Section>

              {/* 9. Changes */}
              <Section icon={<RefreshCw size={16} style={{ color: 'var(--accent)' }} />} title="9. Changes to This Policy">
                <p>We may update this Privacy Policy as the service evolves. Material changes will be communicated via the dashboard and, where required, via email at least 14 days before they take effect. The "Last updated" date at the top of this page will always reflect the most recent revision.</p>
              </Section>

              {/* 10. Contact */}
              <Section icon={<Mail size={16} style={{ color: 'var(--accent)' }} />} title="10. Contact">
                <p>For any questions, requests, or concerns regarding this Privacy Policy or our data practices, please reach out to:</p>
                <div className="mt-4 p-4 rounded-xl border inline-block text-sm" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Rivedix — Data Privacy</p>
                  <a href="mailto:info@rivedix.com" style={{ color: 'var(--accent)' }}>info@rivedix.com</a>
                </div>
              </Section>

            </div>

            <div className="px-8 pb-8">
              <div className="pt-6 border-t flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
                <Link href="/">
                  <Button variant="secondary" className="text-sm font-semibold">← Back to Home</Button>
                </Link>
                <Link href="/terms">
                  <Button variant="ghost" className="text-sm font-semibold">Terms of Service →</Button>
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-10 border-t" style={{ background: 'var(--brand-dark)', borderColor: 'var(--brand-mid)' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: 'var(--on-dark-low)' }}>
            © {new Date().getFullYear()} Rivedix. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium" style={{ color: 'var(--on-dark-mid)' }}>
            <Link href="/">Home</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="mailto:info@rivedix.com" style={{ color: 'inherit' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
          {icon}
        </div>
        <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div className="text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function DataRow({ label, detail, collected }: { label: string; detail: string; collected: boolean }) {
  return (
    <div className="flex gap-3 p-3.5 rounded-xl border text-sm" style={{ background: 'var(--bg-base)', borderColor: collected ? 'var(--border)' : 'var(--success-border)' }}>
      <div className={`size-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${collected ? '' : ''}`}
           style={{ background: collected ? 'var(--accent-light)' : 'var(--success-light)', color: collected ? 'var(--accent)' : 'var(--success)' }}>
        {collected ? '●' : '✕'}
      </div>
      <div>
        <p className="font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p style={{ color: 'var(--text-secondary)' }}>{detail}</p>
        <p className="text-xs mt-1 font-semibold" style={{ color: collected ? 'var(--accent)' : 'var(--success)' }}>
          {collected ? 'Collected' : 'NOT collected'}
        </p>
      </div>
    </div>
  );
}
