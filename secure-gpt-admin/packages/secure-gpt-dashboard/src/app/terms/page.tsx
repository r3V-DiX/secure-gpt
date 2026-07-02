'use client'
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';
import { FileText, Lock, Shield, AlertTriangle, Scale, Mail, RefreshCw, Users, Ban } from 'lucide-react';

export default function TermsPage() {
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
              <Scale size={11} />
              Legal
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Terms of Service</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Effective date: 1 May 2025 &nbsp;·&nbsp; Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <article className="rounded-2xl border animate-fade-in" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}>

            {/* Intro callout */}
            <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-4 p-4 rounded-xl border" style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}>
                <FileText size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Please read these Terms of Service carefully before using SecureGPT. By installing the extension, accessing the dashboard, or creating an account, you agree to be bound by these terms. If you are accepting on behalf of an organisation, you represent that you have authority to bind that organisation.
                </p>
              </div>
            </div>

            <div className="px-8 py-8 space-y-10" style={{ color: 'var(--text-secondary)' }}>

              {/* 1. About SecureGPT */}
              <Section icon={<Shield size={16} style={{ color: 'var(--accent)' }} />} title="1. About SecureGPT">
                <p>SecureGPT is a browser-native Data Loss Prevention (DLP) product developed and operated by <strong>Rivedix</strong>. The service consists of a browser extension that inspects prompts before they are sent to AI providers, a web dashboard for policy management and audit logging, and supporting APIs.</p>
                <p className="mt-3">These Terms govern your access to and use of all SecureGPT products and services (collectively, the "Service").</p>
              </Section>

              {/* 2. Eligibility */}
              <Section icon={<Users size={16} style={{ color: 'var(--accent)' }} />} title="2. Eligibility and Accounts">
                <p className="mb-3">To use SecureGPT you must:</p>
                <ul className="space-y-2 text-sm">
                  {[
                    'Be at least 18 years of age, or have the consent of a legal guardian.',
                    'Provide accurate, complete, and current account information.',
                    'Maintain the confidentiality of your login credentials.',
                    'Promptly notify us of any unauthorised access to your account at info@rivedix.com.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">You are responsible for all activity that occurs under your account. Enterprise accounts may designate administrators who can manage users and policies on behalf of their organisation.</p>
              </Section>

              {/* 3. Permitted use */}
              <Section icon={<FileText size={16} style={{ color: 'var(--accent)' }} />} title="3. Acceptable Use">
                <p className="mb-3">SecureGPT is provided for lawful data protection purposes. You agree to use the Service only in ways that comply with applicable law and your organisation's security policies. Specifically, you agree <strong>not</strong> to:</p>
                <ul className="space-y-2 text-sm">
                  {[
                    'Attempt to reverse-engineer, decompile, or disassemble any part of the extension or dashboard.',
                    'Circumvent, disable, or otherwise interfere with any security or detection feature of the Service.',
                    'Use the Service to process data belonging to others without lawful authority.',
                    'Upload or transmit malware, exploit code, or any other harmful software through the Service.',
                    'Resell, sublicense, or commercially exploit the Service without a written agreement with Rivedix.',
                    'Use automated means to scrape, crawl, or extract data from the dashboard.',
                    'Impersonate another user, person, or organisation.',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: 'var(--danger)', opacity: 0.6 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* 4. Subscription & payment */}
              <Section icon={<FileText size={16} style={{ color: 'var(--accent)' }} />} title="4. Subscriptions and Payment">
                <p>SecureGPT offers a free tier and paid subscription plans. Paid plans are billed monthly or annually in advance. All fees are exclusive of applicable taxes, which are your responsibility. We use industry-standard payment processors — Rivedix does not store payment card data.</p>
                <p className="mt-3">You may cancel your subscription at any time through the dashboard. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial periods, except where required by applicable law.</p>
                <p className="mt-3">We reserve the right to change subscription pricing with at least 30 days' written notice. Continued use after the effective date constitutes acceptance of the new pricing.</p>
              </Section>

              {/* 5. IP */}
              <Section icon={<Lock size={16} style={{ color: 'var(--accent)' }} />} title="5. Intellectual Property">
                <p>The SecureGPT name, logo, extension, dashboard, detection algorithms, and all associated content are the exclusive property of Rivedix or its licensors, protected by copyright, trade secret, and other intellectual property laws.</p>
                <p className="mt-3">These Terms do not grant you any right to use Rivedix trademarks, logos, or other brand features. Subject to your compliance with these Terms, Rivedix grants you a limited, non-exclusive, non-transferable, revocable licence to use the Service for its intended purpose.</p>
              </Section>

              {/* 6. Privacy */}
              <Section icon={<Shield size={16} style={{ color: 'var(--accent)' }} />} title="6. Privacy and Data Processing">
                <p>Our collection and use of personal data is governed by our <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>, which is incorporated into these Terms by reference. By using SecureGPT, you consent to the data practices described therein.</p>
                <p className="mt-3">For enterprise customers, we will enter into a Data Processing Agreement (DPA) as required by GDPR. Please contact <a href="mailto:info@rivedix.com" style={{ color: 'var(--accent)' }}>info@rivedix.com</a> to request a DPA.</p>
              </Section>

              {/* 7. Disclaimers */}
              <Section icon={<AlertTriangle size={16} style={{ color: '#d97706' }} />} title="7. Disclaimers">
                <div className="p-4 rounded-xl border text-sm" style={{ background: 'var(--warning-light)', borderColor: 'var(--warning-border)' }}>
                  <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
                  <p className="mt-3">SECUREGPT DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ALL DATA LEAKS WILL BE DETECTED. NO DETECTION SYSTEM IS 100% ACCURATE. YOU ARE RESPONSIBLE FOR IMPLEMENTING APPROPRIATE SECURITY CONTROLS APPROPRIATE TO YOUR RISK LEVEL.</p>
                </div>
              </Section>

              {/* 8. Liability */}
              <Section icon={<Scale size={16} style={{ color: 'var(--accent)' }} />} title="8. Limitation of Liability">
                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, RIVEDIX SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION — ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF RIVEDIX HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
                <p className="mt-3">RIVEDIX'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO RIVEDIX IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) £100 GBP.</p>
              </Section>

              {/* 9. Indemnification */}
              <Section icon={<Users size={16} style={{ color: 'var(--accent)' }} />} title="9. Indemnification">
                <p>You agree to indemnify, defend, and hold harmless Rivedix and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party right, including privacy or intellectual property rights; or (d) any data you process through the Service.</p>
              </Section>

              {/* 10. Termination */}
              <Section icon={<Ban size={16} style={{ color: '#dc2626' }} />} title="10. Termination">
                <p>You may terminate your account at any time through the dashboard. We reserve the right to suspend or terminate your access to the Service immediately, without prior notice, if we believe you have breached these Terms or are using the Service in a manner that could harm Rivedix, other users, or third parties.</p>
                <p className="mt-3">Upon termination, your right to use the Service ceases immediately. Sections covering intellectual property, disclaimers, limitations of liability, and governing law survive termination.</p>
              </Section>

              {/* 11. Governing law */}
              <Section icon={<Scale size={16} style={{ color: 'var(--accent)' }} />} title="11. Governing Law and Disputes">
                <p>These Terms are governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions. Any dispute arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
              </Section>

              {/* 12. Changes */}
              <Section icon={<RefreshCw size={16} style={{ color: 'var(--accent)' }} />} title="12. Changes to These Terms">
                <p>We may revise these Terms from time to time. For material changes, we will provide at least 14 days' notice via the dashboard or email before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service before the effective date.</p>
              </Section>

              {/* 13. Contact */}
              <Section icon={<Mail size={16} style={{ color: 'var(--accent)' }} />} title="13. Contact">
                <p>For questions about these Terms, to request a DPA, or to report a violation, please contact:</p>
                <div className="mt-4 p-4 rounded-xl border inline-block text-sm" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Rivedix — Legal</p>
                  <a href="mailto:info@rivedix.com" style={{ color: 'var(--accent)' }}>info@rivedix.com</a>
                </div>
              </Section>

            </div>

            <div className="px-8 pb-8">
              <div className="pt-6 border-t flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
                <Link href="/">
                  <Button variant="secondary" className="text-sm font-semibold">← Back to Home</Button>
                </Link>
                <Link href="/privacy">
                  <Button variant="ghost" className="text-sm font-semibold">Privacy Policy →</Button>
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
            <Link href="/privacy">Privacy Policy</Link>
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
