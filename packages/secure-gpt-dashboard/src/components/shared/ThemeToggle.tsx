'use client'
// src/components/shared/ThemeToggle.tsx
// Animated sun/moon toggle button for the sidebar.

import { useTheme } from '@/contexts/theme-context'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
    className?: string
    /** compact = just the icon button; full = icon + label */
    variant?: 'icon' | 'full'
}

export function ThemeToggle({ className = '', variant = 'icon' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    if (variant === 'full') {
        return (
            <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`
          flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium
          w-full border border-transparent
          text-[var(--text-3)] hover:text-[var(--text-2)]
          hover:bg-[var(--surface-3)]
          transition-colors duration-150
          ${className}
        `}
                style={{ fontFamily: 'var(--font)' }}
            >
                {isDark
                    ? <Sun size={14} className="shrink-0 text-[var(--amber)]" />
                    : <Moon size={14} className="shrink-0 text-[var(--text-3)]" />
                }
                <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`
        relative size-7 flex items-center justify-center rounded-lg
        border border-[var(--border-2)]
        bg-[var(--surface-2)] hover:bg-[var(--surface-3)]
        text-[var(--text-3)] hover:text-[var(--text-2)]
        transition-all duration-150 shrink-0
        ${className}
      `}
            style={{ fontFamily: 'var(--font)' }}
        >
            <span
                className="absolute transition-all duration-200"
                style={{
                    opacity: isDark ? 1 : 0,
                    transform: isDark ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-30deg)',
                }}
            >
                <Sun size={13} />
            </span>
            <span
                className="absolute transition-all duration-200"
                style={{
                    opacity: isDark ? 0 : 1,
                    transform: isDark ? 'scale(0.5) rotate(30deg)' : 'scale(1) rotate(0deg)',
                }}
            >
                <Moon size={13} />
            </span>
        </button>
    )
}