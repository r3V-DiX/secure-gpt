'use client'

import { useState, useEffect, useCallback } from 'react'

const SIDEBAR_STORAGE_KEY = 'sgpt-sidebar-collapsed'

let listeners: Array<() => void> = []
const memoryState = {
  collapsed: false,
}

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (saved !== null) {
      memoryState.collapsed = saved === 'true'
    }
  } catch {
    /* ignore */
  }
}

function notify() {
  listeners.forEach(listener => listener())
}

export function useSidebarStore() {
  const [collapsed, setCollapsedState] = useState(memoryState.collapsed)

  useEffect(() => {
    const handleChange = () => setCollapsedState(memoryState.collapsed)
    listeners.push(handleChange)
    return () => {
      listeners = listeners.filter(l => l !== handleChange)
    }
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    memoryState.collapsed = value
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value))
    } catch {
      /* ignore */
    }
    notify()
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(!memoryState.collapsed)
  }, [setCollapsed])

  return {
    collapsed,
    setCollapsed,
    toggle,
  }
}
