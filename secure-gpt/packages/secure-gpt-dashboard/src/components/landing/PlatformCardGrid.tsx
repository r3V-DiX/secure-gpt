'use client'

import { Badge } from '@/components/ui'
import React from 'react'
import { PlatformIcon } from '@/components/shared/PlatformIcon'

export const SUPPORTED_AI_PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT', category: 'Chatbot', domain: 'chatgpt.com', desc: 'OpenAI GPT-4o, o1, Canvas, File Uploads' },
  { id: 'claude', name: 'Claude (Anthropic)', category: 'Chatbot', domain: 'claude.ai', desc: 'Artifacts, Claude 3.5 Sonnet, Projects' },
  { id: 'gemini', name: 'Google Gemini', category: 'Chatbot', domain: 'gemini.google.com', desc: 'Gemini 1.5 Pro, Flash, Google Search' },
  { id: 'copilot', name: 'Microsoft Copilot', category: 'Chatbot', domain: 'copilot.microsoft.com', desc: 'Microsoft 365, Web Search, Notebook' },
  { id: 'perplexity', name: 'Perplexity AI', category: 'Search AI', domain: 'perplexity.ai', desc: 'Pro Search, Collections, Citations' },
  { id: 'deepseek', name: 'DeepSeek', category: 'Chatbot', domain: 'deepseek.com', desc: 'DeepSeek-V3, R1 Reasoning, Web Chat' },
  { id: 'mistral', name: 'Mistral Le Chat', category: 'Chatbot', domain: 'chat.mistral.ai', desc: 'Mistral Large, Pixtral, Document OCR' },
  { id: 'meta-ai', name: 'Meta AI', category: 'Chatbot', domain: 'meta.ai', desc: 'Llama 3.3, Imagine, Assistant' },
  { id: 'poe', name: 'Poe', category: 'Aggregator', domain: 'poe.com', desc: 'Multi-bot prompt interface & bots' },
  { id: 'cursor', name: 'Cursor Web', category: 'Coding AI', domain: 'cursor.com', desc: 'Web Composer, Docs indexer' },
  { id: 'v0', name: 'v0.dev (Vercel)', category: 'Coding AI', domain: 'v0.dev', desc: 'Frontend code generation, Canvas' },
  { id: 'replit', name: 'Replit Agent', category: 'Coding AI', domain: 'replit.com', desc: 'Interactive developer workspace' },
  { id: 'huggingchat', name: 'HuggingChat', category: 'Open Source', domain: 'huggingface.co', desc: 'Open LLMs (Qwen, Llama, Command R)' },
  { id: 'phind', name: 'Phind AI', category: 'Coding AI', domain: 'phind.com', desc: 'Technical developer search engine' },
  { id: 'notion', name: 'Notion AI', category: 'Enterprise', domain: 'notion.so', desc: 'Workspace AI, Doc Generation' },
  { id: 'jasper', name: 'Jasper AI', category: 'Marketing', domain: 'jasper.ai', desc: 'Enterprise marketing copy & campaigns' },
  { id: 'copy-ai', name: 'Copy.ai', category: 'Marketing', domain: 'copy.ai', desc: 'Sales automation & content workflows' },
] as const

export function PlatformCardGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {SUPPORTED_AI_PLATFORMS.map((p) => (
        <div
          key={p.id}
          className="p-5 rounded-md border transition-all duration-200 hover:-translate-y-0.5 shadow-xs flex flex-col justify-between"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <PlatformIcon platformId={p.id} size={36} className="rounded-xl shadow-xs" />
              <Badge variant="success" className="font-mono">
                Protected
              </Badge>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {p.name}
            </h3>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
              {p.desc}
            </p>
          </div>
          <div
            className="pt-3 border-t flex items-center justify-between text-[11px] font-mono"
            style={{ borderColor: 'var(--border-2)', color: 'var(--text-muted)' }}
          >
            <span>{p.domain}</span>
            <span className="text-[10px] font-sans font-semibold text-[var(--accent)]">{p.category}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
