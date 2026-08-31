'use client'

import React, { useState, useRef, useCallback } from 'react'
import { SidebarInner } from './Sidebar-inner'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { useSidebarStore } from '@/lib/store/sidebar-store'

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const { collapsed, toggle } = useSidebarStore()
  const [hovered, setHovered] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (!collapsed) return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHovered(true)
  }, [collapsed])

  const handleMouseLeave = useCallback(() => {
    if (!collapsed) return
    hoverTimer.current = setTimeout(() => {
      setHovered(false)
    }, 140)
  }, [collapsed])

  const mobileTrapRef = useFocusTrap(mobileOpen)
  const isExpanded = !collapsed || hovered

  return (
    <>
      {/* ── Desktop Sidebar Wrapper ── */}
      <div
        className={`hidden md:block sh-sidebar-wrapper${collapsed ? ' sh-sidebar-wrapper--collapsed' : ''}${collapsed && hovered ? ' sh-sidebar-wrapper--hovered' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <aside
          className={`sh-sidebar${collapsed ? ' sh-sidebar--collapsed' : ''}${isExpanded ? ' sh-sidebar--expanded' : ''}`}
          aria-label="Primary navigation"
        >
          <SidebarInner
            isMobile={false}
            collapsed={collapsed && !hovered}
            expanded={isExpanded}
            onToggleCollapse={toggle}
            onNavigate={() => setMobileOpen(false)}
          />
        </aside>
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <aside
        ref={mobileTrapRef as React.Ref<HTMLElement>}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
        className={`sh-sidebar-mobile${mobileOpen ? ' sh-sidebar-mobile--open' : ''} md:hidden`}
      >
        <SidebarInner
          isMobile={true}
          collapsed={false}
          expanded={true}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>
    </>
  )
}
