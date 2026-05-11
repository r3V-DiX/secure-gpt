'use client'
// src/contexts/theme-context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('sgpt-theme') as Theme | null
    // Default to 'light' instead of following system preference if no stored value
    const initial = stored ?? 'light'
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('sgpt-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}

// Standalone toggle button — used in sidebar
export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        group flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl
        text-[13px] font-medium transition-all duration-150
        text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)]
        hover:bg-[var(--sidebar-hover-bg)]
        ${className}
      `}
    >
      <span className="relative size-[30px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
        <Sun
          size={13}
          className={`absolute transition-all duration-300 ${
            theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
          } text-amber-300`}
        />
        <Moon
          size={13}
          className={`absolute transition-all duration-300 ${
            theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          } text-indigo-300`}
        />
      </span>
      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}