'use client'

import { SocketProvider } from '@/context/SocketContext'
import { PresenceProvider } from '@/context/PresenceContext'
import Sidebar from '@/components/sidebar/Sidebar'

export default function ChatShell({ user, children }) {
  return (
    <SocketProvider>
      <PresenceProvider>
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface-0)' }}>
          <Sidebar user={user} />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </PresenceProvider>
    </SocketProvider>
  )
}
