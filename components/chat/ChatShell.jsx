'use client'

import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { SocketProvider } from '@/context/SocketContext'
import { PresenceProvider } from '@/context/PresenceContext'
import Sidebar from '@/components/sidebar/Sidebar'

// Lets ChatWindow reach the "go back to sidebar" action on mobile
const MobileNavContext = createContext({ openSidebar: () => {} })
export function useMobileNav() {
  return useContext(MobileNavContext)
}

export default function ChatShell({ user, children }) {
  const pathname = usePathname()
  const isConversationRoute = /^\/chat\/(room|dm)\//.test(pathname)

  // Start with sidebar closed if we land directly on a conversation URL
  const [sidebarOpen, setSidebarOpen] = useState(!isConversationRoute)

  // Sync with navigation (browser back/forward, direct URL)
  useEffect(() => {
    if (isConversationRoute) setSidebarOpen(false)
    else setSidebarOpen(true)
  }, [pathname, isConversationRoute])

  const openConversation = useCallback(() => setSidebarOpen(false), [])
  const openSidebar = useCallback(() => setSidebarOpen(true), [])

  return (
    <SocketProvider>
      <PresenceProvider>
        <MobileNavContext.Provider value={{ openSidebar }}>
          <div
            className="flex h-screen overflow-hidden"
            style={{ background: 'var(--color-surface-0)' }}
          >
            {/* ── Sidebar ──────────────────────────────────────────────
                Mobile  : full-width when sidebarOpen, hidden otherwise
                Desktop : always visible at --sidebar-width             */}
            <div
              className={[
                'flex-shrink-0 h-full flex flex-col w-full',
                sidebarOpen ? 'flex' : 'hidden',
                'md:flex md:w-[var(--sidebar-width)]',
              ].join(' ')}
            >
              <Sidebar user={user} onNavigate={openConversation} />
            </div>

            {/* ── Main content ─────────────────────────────────────────
                Mobile  : full-width when conversation open, hidden otherwise
                Desktop : always visible, flex-1                        */}
            <main
              className={[
                'flex-col overflow-hidden flex-1',
                sidebarOpen ? 'hidden' : 'flex',
                'md:flex',
              ].join(' ')}
            >
              {children}
            </main>
          </div>
        </MobileNavContext.Provider>
      </PresenceProvider>
    </SocketProvider>
  )
}
