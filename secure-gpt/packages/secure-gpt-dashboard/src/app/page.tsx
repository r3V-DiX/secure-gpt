'use client'
import Link from 'next/link';
import { Button } from '@/components/ui/button/button';
import { useAuth } from '@/contexts/auth-context';
import {
  BarChart3,
  Globe,
  ArrowRight,
  EyeOff,
  Users,
  ShieldCheck,
  Search,
  Scan,
  Mail,
  ExternalLink,
  AtSign,
  Link2,
  Lock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileKey,
  Fingerprint,
  Network,
  History,
} from 'lucide-react';

import { PlatformIcon } from '@/components/shared/PlatformIcon';

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/securegpt-%E2%80%94-llm-data-prot/cbhlhbhhlcfilggkmcmodmfaeongmbmo';

const ALL_HERO_PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'claude', name: 'Claude' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'copilot', name: 'Copilot' },
  { id: 'perplexity', name: 'Perplexity' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'cursor', name: 'Cursor' },
  { id: 'mistral', name: 'Mistral' },
  { id: 'meta-ai', name: 'Meta AI' },
  { id: 'v0', name: 'v0.dev' },
  { id: 'replit', name: 'Replit' },
  { id: 'poe', name: 'Poe' },
  { id: 'huggingchat', name: 'HuggingChat' },
  { id: 'phind', name: 'Phind' },
  { id: 'notion', name: 'Notion AI' },
  { id: 'jasper', name: 'Jasper' },
  { id: 'copy-ai', name: 'Copy.ai' },
] as const;

export default function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-poppins), Poppins, system-ui, sans-serif' }}>

      {/* ── Navigation ── */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md"
           style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <a href="#hero" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl flex items-center justify-center shadow-md overflow-hidden"
                 style={{ background: 'var(--brand-dark)' }}>
              <img src="/rivedix_logo.png" alt="SecureGPT" className="w-full h-full object-contain p-1" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Secure<span style={{ color: 'var(--accent)' }}>GPT</span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Features</a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>How it works</a>
            <a href="#platforms" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Platforms</a>
            <a href="#threat-coverage" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>Coverage</a>
            <Link href="/versions" className="text-sm font-medium transition-colors flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}
               onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
               onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
              <span>Versions</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent-text)] border border-[var(--accent-border)] font-semibold">
                v1.1.2
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!loading && user ? (
              <Link href="/dashboard">
                <Button className="rounded-full px-6">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex text-sm font-semibold">Sign In</Button>
                </Link>
                <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full px-6 text-sm font-semibold"
                          style={{ boxShadow: '0 4px 14px var(--brand-btn-shadow)' }}>
                    Get Started Free
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section id="hero" className="relative pt-20 pb-28 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {/* Grid lines */}
            <div className="absolute inset-0"
                 style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.55 }} />
            {/* Fade grid out at the bottom so it blends into page */}
            <div className="absolute inset-0"
                 style={{ background: 'linear-gradient(to bottom, transparent 55%, var(--bg-base) 100%)' }} />
            {/* Colour blobs on top of grid */}
            <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-30"
                 style={{ background: `radial-gradient(circle, var(--hero-blob-1) 0%, transparent 70%)` }} />
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-25"
                 style={{ background: `radial-gradient(circle, var(--hero-blob-2) 0%, transparent 70%)` }} />
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
                 style={{ background: 'var(--accent-light)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
              <Lock size={11} className="fill-current" />
              Enterprise-grade DLP · Zero cloud exposure · Browser-native
            </div>

            <h1 className="text-5xl md:text-[4.25rem] font-extrabold tracking-tight mb-6 leading-[1.1]"
                style={{ color: 'var(--text-primary)' }}>
              Your prompts carry secrets. <br />
              <span style={{ background: 'linear-gradient(135deg, var(--hero-grad-from) 0%, var(--hero-grad-to) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SecureGPT makes sure they stay that way.
              </span>
            </h1>

            <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              A browser extension that intercepts every prompt you type into ChatGPT, Claude, or Gemini, strips out PII, API keys, and confidential data locally — and only then lets the message through.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium mb-10 border"
                 style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>
              <AlertTriangle size={13} />
              89% of employees unknowingly share sensitive data with AI tools — Cyberhaven 2024
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 font-semibold group"
                        style={{ boxShadow: '0 4px 20px var(--brand-btn-shadow)' }}>
                  <Shield size={16} className="mr-1.5" />
                  Add to Chrome — Free
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <a href="mailto:info@rivedix.com?subject=SecureGPT Enterprise Demo" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 font-semibold">
                  Book Enterprise Demo
                </Button>
              </a>
            </div>

            <div className="mt-20">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Active client-side DLP protection across 17+ major AI platforms
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
                {ALL_HERO_PLATFORMS.map(p => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 shadow-2xs"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                  >
                    <PlatformIcon platformId={p.id} size={16} className="rounded-xs shrink-0" />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat strip ── */}
        <section className="border-y py-10 px-6"
                 style={{ background: 'var(--brand-dark)', borderColor: 'var(--brand-mid)' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50+',     label: 'Sensitive data types detected' },
              { value: '< 2ms',   label: 'Local analysis latency' },
              { value: '0 bytes', label: 'Raw data sent to our servers' },
              { value: '100%',    label: 'Browser-side redaction' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl font-bold mb-1" style={{ color: 'var(--brand-light)' }}>{stat.value}</p>
                <p className="text-xs font-medium" style={{ color: 'var(--on-dark-mid)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-28 px-6" style={{ background: 'var(--bg-surface)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>What SecureGPT does</p>
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Enterprise DLP, Built for the AI Era</h2>
              <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Multiple detection layers designed to catch data leaks before they happen — without adding friction for your team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FeatureCard icon={<Search size={22} style={{ color: 'var(--accent)' }} />}
                           iconBg="var(--accent-light)" title="Real-time Prompt Inspection"
                           desc="Regex, Named Entity Recognition, and entropy analysis run on every keystroke — catching API keys, PII, IBAN numbers, JWTs, and 50+ other sensitive patterns before you hit send." />
              <FeatureCard icon={<EyeOff size={22} style={{ color: 'var(--success)' }} />}
                           iconBg="var(--success-light)" title="100% Local Masking"
                           desc="All detection and redaction happens inside your browser tab. Raw sensitive data never leaves your device — only a safe masked version reaches the AI provider." />
              <FeatureCard icon={<Scan size={22} style={{ color: 'var(--info)' }} />}
                           iconBg="var(--info-light)" title="Image & File Scanning"
                           desc="OCR analysis catches sensitive data hidden in screenshots, PDFs, and file uploads before they're attached to a prompt. No format is left unprotected." />
              <FeatureCard icon={<BarChart3 size={22} style={{ color: 'var(--warning)' }} />}
                           iconBg="var(--warning-light)" title="Compliance Audit Logs"
                           desc="Every detection and policy action is logged with full context — user, platform, data type, and outcome. Meet GDPR, HIPAA, and SOC 2 audit requirements with ease." />
              <FeatureCard icon={<Globe size={22} style={{ color: 'var(--violet)' }} />}
                           iconBg="var(--violet-light)" title="Works on Every AI Platform"
                           desc="Natively intercepts ChatGPT, Claude, Gemini, Microsoft Copilot, Perplexity, and any custom internal LLM interface — no manual configuration required." />
              <FeatureCard icon={<Users size={22} style={{ color: 'var(--danger)' }} />}
                           iconBg="var(--danger-light)" title="Admin Policy Control"
                           desc="Define per-department detection rules and enforcement levels. Admins decide what gets masked, warned, or hard-blocked. Employees keep working without interruption." />
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-28 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>Under the hood</p>
                <h2 className="text-4xl font-bold mb-10 leading-tight" style={{ color: 'var(--text-primary)' }}>
                  Three steps.<br />Zero data exposure.
                </h2>
                <div className="space-y-8">
                  <Step number="01" title="Intercept the prompt"
                        desc="SecureGPT hooks directly into LLM input fields on supported platforms, capturing the message before your browser transmits it." />
                  <Step number="02" title="Detect locally"
                        desc="A multi-tier analysis pipeline — Regex, NER, entropy checks, and IBAN/JWT validators — runs entirely in your browser tab to flag sensitive entities in real time." />
                  <Step number="03" title="Enforce your policy"
                        desc="Based on your organisation's policy, entities are auto-masked with a safe placeholder, surfaced in a warning for user review, or blocked outright. Every action is logged." />
                </div>
              </div>

              {/* Mock browser UI */}
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border"
                     style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b"
                       style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                    <div className="size-3 rounded-full bg-red-400" />
                    <div className="size-3 rounded-full bg-amber-400" />
                    <div className="size-3 rounded-full bg-green-400" />
                    <div className="flex-1 mx-4 px-3 py-1 rounded-md text-[11px] font-mono text-center"
                         style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)', border: '1px solid var(--border)' }}>
                      chatgpt.com
                    </div>
                    <div className="size-4 rounded-full flex items-center justify-center"
                         style={{ background: 'var(--accent-light)' }}>
                      <Lock size={8} style={{ color: 'var(--accent)' }} />
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4">
                    <div className="rounded-xl border p-3 text-xs font-mono leading-relaxed"
                         style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Here is my API key for the integration:&nbsp;
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold"
                            style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
                        ⚠ sk-proj-7aGx...
                      </span>
                      &nbsp;— please use this.
                    </div>

                    <div className="rounded-xl border p-4 flex gap-3"
                         style={{ background: 'var(--danger-light)', borderColor: 'var(--danger-border)' }}>
                      <ShieldCheck size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                      <div>
                        <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--danger)' }}>
                          SecureGPT · API Key Detected
                        </p>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--danger)', opacity: 0.85 }}>
                          Found: OpenAI API Key (98% confidence). Company policy blocks credential sharing with external AI providers. This event is being logged.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 h-9 rounded-lg border text-[11px] font-semibold"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
                        Edit message
                      </button>
                      <button className="flex-1 h-9 rounded-lg text-[11px] font-bold text-white"
                              style={{ background: 'var(--accent)' }}>
                        🔒 Mask &amp; Send
                      </button>
                      <button className="flex-1 h-9 rounded-lg text-[11px] font-semibold"
                              style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                        Block
                      </button>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 px-3 py-2 rounded-xl shadow-lg border flex items-center gap-2"
                     style={{ background: 'var(--bg-surface)', borderColor: 'var(--accent-border)' }}>
                  <Shield size={14} style={{ color: 'var(--accent)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>Protected by SecureGPT</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Supported AI Platforms (17 Total) ── */}
        <section id="platforms" className="py-28 px-6 border-t"
                 style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border"
                   style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}>
                <Globe size={13} />
                Universal LLM Egress Protection
              </div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Zero-Config Coverage for 17+ AI Platforms
              </h2>
              <p className="max-w-2xl mx-auto text-base" style={{ color: 'var(--text-secondary)' }}>
                SecureGPT automatically hooks into web chat areas, prompt inputs, and drag-and-drop file upload zones across all industry standard generative AI tools.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { id: 'chatgpt',    name: 'ChatGPT',           category: 'Chatbot',    domain: 'chatgpt.com', desc: 'OpenAI GPT-4o, o1, Canvas, File Uploads' },
                { id: 'claude',     name: 'Claude (Anthropic)', category: 'Chatbot',    domain: 'claude.ai', desc: 'Artifacts, Claude 3.5 Sonnet, Projects' },
                { id: 'gemini',     name: 'Google Gemini',     category: 'Chatbot',    domain: 'gemini.google.com', desc: 'Gemini 1.5 Pro, Flash, Google Search' },
                { id: 'copilot',    name: 'Microsoft Copilot', category: 'Chatbot',    domain: 'copilot.microsoft.com', desc: 'Microsoft 365, Web Search, Notebook' },
                { id: 'perplexity', name: 'Perplexity AI',     category: 'Search AI',  domain: 'perplexity.ai', desc: 'Pro Search, Collections, Citations' },
                { id: 'deepseek',   name: 'DeepSeek',          category: 'Chatbot',    domain: 'deepseek.com', desc: 'DeepSeek-V3, R1 Reasoning, Web Chat' },
                { id: 'mistral',    name: 'Mistral Le Chat',   category: 'Chatbot',    domain: 'chat.mistral.ai', desc: 'Mistral Large, Pixtral, Document OCR' },
                { id: 'meta-ai',    name: 'Meta AI',           category: 'Chatbot',    domain: 'meta.ai', desc: 'Llama 3.3, Imagine, Assistant' },
                { id: 'poe',        name: 'Poe',               category: 'Aggregator', domain: 'poe.com', desc: 'Multi-bot prompt interface & bots' },
                { id: 'cursor',     name: 'Cursor Web',        category: 'Coding AI',  domain: 'cursor.com', desc: 'Web Composer, Docs indexer' },
                { id: 'v0',         name: 'v0.dev (Vercel)',   category: 'Coding AI',  domain: 'v0.dev', desc: 'Frontend code generation, Canvas' },
                { id: 'replit',     name: 'Replit Agent',      category: 'Coding AI',  domain: 'replit.com', desc: 'Interactive developer workspace' },
                { id: 'huggingchat',name: 'HuggingChat',       category: 'Open Source',domain: 'huggingface.co', desc: 'Open LLMs (Qwen, Llama, Command R)' },
                { id: 'phind',      name: 'Phind AI',          category: 'Coding AI',  domain: 'phind.com', desc: 'Technical developer search engine' },
                { id: 'notion',     name: 'Notion AI',         category: 'Enterprise', domain: 'notion.so', desc: 'Workspace AI, Doc Generation' },
                { id: 'jasper',     name: 'Jasper AI',         category: 'Marketing',  domain: 'jasper.ai', desc: 'Enterprise marketing copy & campaigns' },
                { id: 'copy-ai',    name: 'Copy.ai',           category: 'Marketing',  domain: 'copy.ai', desc: 'Sales automation & content workflows' },
              ].map(p => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex flex-col justify-between"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <PlatformIcon platformId={p.id} size={36} className="rounded-xl shadow-xs" />
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                        Protected
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {p.name}
                    </h3>
                    <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {p.desc}
                    </p>
                  </div>
                  <div className="pt-3 border-t flex items-center justify-between text-[11px] font-mono"
                       style={{ borderColor: 'var(--border-2)', color: 'var(--text-muted)' }}>
                    <span>{p.domain}</span>
                    <span className="text-[10px] font-sans font-semibold text-[var(--accent)]">{p.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Threat coverage ── */}
        <section id="threat-coverage" className="py-28 px-6 border-t"
                 style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>Threat coverage</p>
              <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>What SecureGPT Catches</h2>
              <p className="max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Every category of sensitive data that shouldn't be in an AI prompt — detected and masked before it leaves your browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <ThreatCard icon={<FileKey size={20} style={{ color: 'var(--accent)' }} />}
                          iconBg="var(--accent-light)" category="Credentials & Secrets"
                          items={['API keys (OpenAI, AWS, GCP…)', 'Private SSH / RSA keys', 'JWT tokens', 'Passwords & tokens', 'OAuth secrets']} />
              <ThreatCard icon={<Fingerprint size={20} style={{ color: 'var(--success)' }} />}
                          iconBg="var(--success-light)" category="Personal Identity (PII)"
                          items={['Full names & emails', 'Phone numbers', 'National ID / SSN', 'Passport numbers', 'Date of birth']} />
              <ThreatCard icon={<BarChart3 size={20} style={{ color: 'var(--warning)' }} />}
                          iconBg="var(--warning-light)" category="Financial Data"
                          items={['Credit / debit card numbers', 'IBAN & SWIFT codes', 'Bank account numbers', 'Tax IDs', 'Investment details']} />
              <ThreatCard icon={<Network size={20} style={{ color: 'var(--violet)' }} />}
                          iconBg="var(--violet-light)" category="Corporate IP"
                          items={['Internal IP addresses', 'Internal hostnames', 'Database connection strings', 'Confidential project names', 'Unreleased product data']} />
            </div>
          </div>
        </section>

        {/* ── Trust signals ── */}
        <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TrustCard icon={<Lock size={18} style={{ color: 'var(--accent)' }} />}
                         title="Zero cloud exposure"
                         desc="Detection, masking, and enforcement run entirely inside your browser tab. We never see your raw prompts." />
              <TrustCard icon={<ShieldCheck size={18} style={{ color: 'var(--success)' }} />}
                         title="Compliance ready"
                         desc="Audit logs and policy controls built for GDPR, HIPAA, SOC 2, and internal data governance frameworks." />
              <TrustCard icon={<AlertTriangle size={18} style={{ color: 'var(--warning)' }} />}
                         title="Policy enforcement"
                         desc="Admins set the rules. Employees get clear warnings. Nothing slips through undetected or unlogged." />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-28 px-6">
          <div className="max-w-5xl mx-auto rounded-3xl p-12 md:p-20 text-center relative overflow-hidden text-white"
               style={{ background: 'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand-mid) 50%, var(--accent) 100%)' }}>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border"
                   style={{ background: 'var(--on-dark-faint)', borderColor: 'var(--on-dark-border)', color: 'var(--brand-link)' }}>
                <Shield size={11} />
                Your team is using AI right now
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
                Every unprotected prompt<br />is a potential breach.
              </h2>
              <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: 'var(--on-dark-body)' }}>
                SecureGPT takes 2 minutes to install and immediately starts protecting every message your team sends to AI tools — for free.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="lg"
                          className="rounded-full px-10 font-bold border-transparent"
                          style={{ background: 'var(--on-dark-full)', color: 'var(--brand-dark)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                    <Shield size={16} className="mr-2" style={{ color: 'var(--accent)' }} />
                    Add to Chrome — It's Free
                  </Button>
                </a>
                <a href="mailto:info@rivedix.com?subject=SecureGPT Enterprise"
                   className="text-sm font-semibold pb-0.5 transition-colors"
                   style={{ color: 'var(--brand-link)', borderBottom: '1px solid var(--on-dark-border)' }}>
                  Talk to our security team →
                </a>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.04] pointer-events-none"
                 style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '36px 36px' }} />
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="py-16 border-t"
              style={{ background: 'var(--brand-dark)', borderColor: 'var(--brand-mid)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="size-8 rounded-lg flex items-center justify-center overflow-hidden"
                     style={{ background: 'var(--on-dark-logo)' }}>
                  <img src="/rivedix_logo.png" alt="SecureGPT" className="w-full h-full object-contain p-0.5" />
                </div>
                <span className="text-lg font-bold" style={{ color: 'var(--on-dark-full)' }}>
                  Secure<span style={{ color: 'var(--brand-light)' }}>GPT</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: 'var(--on-dark-mid)' }}>
                Browser-native DLP for AI — built by{' '}
                <a href="https://rivedix.com" target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--brand-link)' }}>Rivedix</a>.
              </p>
              <a href="mailto:info@rivedix.com"
                 className="inline-flex items-center gap-2 text-xs"
                 style={{ color: 'var(--on-dark-muted)' }}>
                <Mail size={12} />
                info@rivedix.com
              </a>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--on-dark-high)' }}>Product</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--on-dark-muted)' }}>
                <li><a href="#features" style={{ color: 'inherit' }}>Features</a></li>
                <li><a href="#how-it-works" style={{ color: 'inherit' }}>How it works</a></li>
                <li><a href="#platforms" style={{ color: 'inherit' }}>Supported Platforms (17)</a></li>
                <li><a href="#threat-coverage" style={{ color: 'inherit' }}>Threat coverage</a></li>
                <li><Link href="/versions" style={{ color: 'var(--brand-light)' }}>Version History (v1.1.2)</Link></li>
                <li><a href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-light)' }}>Chrome Extension ↗</a></li>
                <li><Link href="/dashboard" style={{ color: 'inherit' }}>Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--on-dark-high)' }}>Company</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--on-dark-muted)' }}>
                <li><a href="https://rivedix.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>About Rivedix</a></li>
                <li><a href="mailto:info@rivedix.com?subject=SecureGPT Enterprise" style={{ color: 'inherit' }}>Enterprise Sales</a></li>
                <li><a href="mailto:info@rivedix.com" style={{ color: 'inherit' }}>Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-5" style={{ color: 'var(--on-dark-high)' }}>Legal</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--on-dark-muted)' }}>
                <li><Link href="/privacy" style={{ color: 'inherit' }}>Privacy Policy</Link></li>
                <li><Link href="/terms" style={{ color: 'inherit' }}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-5"
               style={{ borderColor: 'var(--brand-mid)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--on-dark-low)' }}>
              © {new Date().getFullYear()} Rivedix. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <a href="https://github.com/rivedix" target="_blank" rel="noopener noreferrer" aria-label="GitHub"
                 style={{ color: 'var(--on-dark-low)' }}><Link2 size={17} /></a>
              <a href="https://twitter.com/rivedix" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
                 style={{ color: 'var(--on-dark-low)' }}><AtSign size={17} /></a>
              <a href="https://linkedin.com/company/rivedix" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                 style={{ color: 'var(--on-dark-low)' }}><ExternalLink size={17} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, iconBg, title, desc }: { icon: React.ReactNode; iconBg: string; title: string; desc: string }) {
  return (
    <div className="p-7 rounded-2xl border transition-all duration-300 group hover:-translate-y-1"
         style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
         onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
         onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'; }}>
      <div className="size-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
           style={{ background: iconBg }}>
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="flex gap-5">
      <div className="text-2xl font-black tabular-nums leading-none mt-0.5 w-8 shrink-0"
           style={{ color: 'var(--accent-border)' }}>
        {number}
      </div>
      <div>
        <h4 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </div>
  );
}

function ThreatCard({ icon, iconBg, category, items }: { icon: React.ReactNode; iconBg: string; category: string; items: string[] }) {
  return (
    <div className="p-6 rounded-2xl border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
      <div className="size-10 rounded-xl flex items-center justify-center mb-4" style={{ background: iconBg }}>
        {icon}
      </div>
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{category}</h3>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TrustCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl border flex gap-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <div className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
           style={{ background: 'var(--bg-surface-2)' }}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h4>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
      </div>
    </div>
  );
}
