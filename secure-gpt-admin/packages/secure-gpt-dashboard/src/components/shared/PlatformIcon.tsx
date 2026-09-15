import React, { useState } from 'react'

export interface PlatformIconProps {
  platformId: string
  size?: number
  className?: string
}

// Map platformId to the local file in /icons/[filename]
const LOCAL_ICON_FILES: Record<string, string> = {
  chatgpt: '/icons/chatgpt.png',
  gemini: '/icons/gemini.png',
  copilot: '/icons/copilot.png',
  claude: '/icons/claude.png',
  perplexity: '/icons/perplexity.png',
  'meta-ai': '/icons/meta-ai.png',
  poe: '/icons/poe.png',
  mistral: '/icons/mistral.png',
  cursor: '/icons/cursor.png',
  v0: '/icons/v0.png',
  replit: '/icons/replit.png',
  huggingchat: '/icons/huggingchat.png',
  deepseek: '/icons/deepseek.png',
  phind: '/icons/phind.png',
  notion: '/icons/notion.png',
  jasper: '/icons/jasper.png',
  'copy-ai': '/icons/copy-ai.png',
}

export function PlatformIcon({ platformId, size = 24, className = '' }: PlatformIconProps) {
  const [imgError, setImgError] = useState(false)
  const iconSrc = LOCAL_ICON_FILES[platformId]

  // If local icon exists and hasn't failed loading, use the PNG/SVG from /icons/
  if (iconSrc && !imgError) {
    return (
      <img
        src={iconSrc}
        alt={platformId}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className={`object-contain rounded-md shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  // Fallback vector SVG if file is not yet added in /icons/
  switch (platformId) {
    case 'chatgpt':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#10A37F" />
          <path
            d="M18.2 10.4a4.4 4.4 0 0 0-.4-3.8 4.5 4.5 0 0 0-4.5-2.2 4.4 4.4 0 0 0-3.6 1.8 4.5 4.5 0 0 0-3 2.1 4.4 4.4 0 0 0 .5 4.7 4.4 4.4 0 0 0 .4 3.8 4.5 4.5 0 0 0 4.5 2.2 4.4 4.4 0 0 0 3.6-1.8 4.5 4.5 0 0 0 3-2.1 4.4 4.4 0 0 0-.5-4.7zm-6.2 7.7a3.4 3.4 0 0 1-2.4-1l1.3-.8a2.3 2.3 0 0 0 3.4.1v.2a3.4 3.4 0 0 1-2.3 1.5zm-4.7-3a3.4 3.4 0 0 1-.3-2.6l1.4.5a2.3 2.3 0 0 0 1.6 3.1l-.2.1a3.4 3.4 0 0 1-2.5-1.1zm-.8-5.3a3.4 3.4 0 0 1 2.1-1.6v1.5a2.3 2.3 0 0 0-1.7 2.9l-.1-.1a3.4 3.4 0 0 1-.3-2.7zm8.4 2.8l-3.3-1.9 1.3-.8 2 1.2a2.3 2.3 0 0 1 1 1.7 3.4 3.4 0 0 1-1 1.8zm1.2-2.1a3.4 3.4 0 0 1 .3 2.6l-1.4-.5a2.3 2.3 0 0 0-1.6-3.1l.2-.1a3.4 3.4 0 0 1 2.5 1.1zm-4.2-3.1a3.4 3.4 0 0 1 2.4 1l-1.3.8a2.3 2.3 0 0 0-3.4-.1v-.2a3.4 3.4 0 0 1 2.3-1.5z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'gemini':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#1E293B" />
          <path
            d="M12 3C12 7.97 7.97 12 3 12C7.97 12 12 16.03 12 21C12 16.03 16.03 12 21 12C16.03 12 12 7.97 12 3Z"
            fill="url(#gemini-grad-admin)"
          />
          <defs>
            <linearGradient id="gemini-grad-admin" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4E82EE" />
              <stop offset="0.5" stopColor="#9B72CB" />
              <stop offset="1" stopColor="#D96570" />
            </linearGradient>
          </defs>
        </svg>
      )
    case 'copilot':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#0078D4" />
          <path
            d="M7 8.5C7 7.12 8.12 6 9.5 6H14.5C15.88 6 17 7.12 17 8.5V11H7V8.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M6 12C6 10.9 6.9 10 8 10H16C17.1 10 18 10.9 18 12V14.5C18 16.43 16.43 18 14.5 18H9.5C7.57 18 6 16.43 6 14.5V12Z"
            fill="#FFFFFF"
            fillOpacity="0.85"
          />
          <circle cx="10" cy="13.5" r="1.2" fill="#0078D4" />
          <circle cx="14" cy="13.5" r="1.2" fill="#0078D4" />
        </svg>
      )
    case 'claude':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#D97706" />
          <path
            d="M12 5L13.8 9.5L18.5 10.2L15 13.4L16 18L12 15.6L8 18L9 13.4L5.5 10.2L10.2 9.5L12 5Z"
            fill="#FFFBEB"
          />
        </svg>
      )
    case 'perplexity':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#13343B" />
          <path
            d="M12 4V10M12 14V20M4 12H10M14 12H20M6.5 6.5L10.5 10.5M13.5 13.5L17.5 17.5M17.5 6.5L13.5 10.5M10.5 13.5L6.5 17.5"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'meta-ai':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#0064E0" />
          <circle cx="12" cy="12" r="6" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M12 6A6 6 0 0 1 18 12" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
    case 'poe':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#5B21B6" />
          <path
            d="M8 7H14C16.2 7 18 8.8 18 11C18 13.2 16.2 15 14 15H11V18H8V7ZM11 12H14C14.6 12 15 11.6 15 11C15 10.4 14.6 10 14 10H11V12Z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'mistral':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#FF7000" />
          <path
            d="M6 7H9V17H6V7ZM15 7H18V17H15V7ZM10.5 10H13.5V17H10.5V10Z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'cursor':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#0F172A" />
          <path
            d="M7 5L17 12L12.5 13.5L15 18.5L13 19.5L10.5 14.5L7 17.5V5Z"
            fill="#38BDF8"
          />
        </svg>
      )
    case 'v0':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#000000" />
          <path
            d="M6 8L10 16H12L16 8H13.8L11 13.8L8.2 8H6ZM17 15C17.55 15 18 14.55 18 14C18 13.45 17.55 13 17 13C16.45 13 16 13.45 16 14C16 14.55 16.45 15 17 15Z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'replit':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#F26207" />
          <path
            d="M6 6H13V10H6V6ZM11 10H18V14H11V10ZM6 14H13V18H6V14Z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'huggingchat':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#FFD21E" />
          <circle cx="9.5" cy="11.5" r="1.5" fill="#1F2937" />
          <circle cx="14.5" cy="11.5" r="1.5" fill="#1F2937" />
          <path
            d="M8.5 14.5C9.5 16 14.5 16 15.5 14.5"
            stroke="#1F2937"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'deepseek':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#1E40AF" />
          <path
            d="M6 12C6 8.69 8.69 6 12 6C14.76 6 17.09 7.87 17.78 10.41L15.36 11.22C14.93 9.68 13.58 8.57 12 8.57C10.11 8.57 8.57 10.11 8.57 12C8.57 13.89 10.11 15.43 12 15.43C13.58 15.43 14.93 14.32 15.36 12.78L17.78 13.59C17.09 16.13 14.76 18 12 18C8.69 18 6 15.31 6 12Z"
            fill="#93C5FD"
          />
          <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
        </svg>
      )
    case 'phind':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#0D9488" />
          <path
            d="M10 7H14C16.2 7 18 8.8 18 11C18 13.2 16.2 15 14 15H12V18H9V7H10ZM12 12.5H14C14.8 12.5 15.5 11.8 15.5 11C15.5 10.2 14.8 9.5 14 9.5H12V12.5Z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'notion':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#000000" />
          <path
            d="M6.5 6.5L16 5L17.5 7V17.5L15 18.5L8.5 7.5V17L6.5 17.5V6.5Z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'jasper':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#6366F1" />
          <path
            d="M7 6H17V9H13.5V15C13.5 16.66 12.16 18 10.5 18C8.84 18 7.5 16.66 7.5 15V14H10.5V15C10.5 15.28 10.72 15.5 11 15.5C11.28 15.5 11.5 15.28 11.5 15V9H7V6Z"
            fill="#FFFFFF"
          />
        </svg>
      )
    case 'copy-ai':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <rect width="24" height="24" rx="6" fill="#2563EB" />
          <circle cx="10" cy="12" r="4" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="14" cy="12" r="4" stroke="#93C5FD" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      )
    default:
      return (
        <div
          className={`flex items-center justify-center rounded-md font-bold text-xs bg-slate-800 text-white ${className}`}
          style={{ width: size, height: size }}
        >
          {platformId.slice(0, 2).toUpperCase()}
        </div>
      )
  }
}
