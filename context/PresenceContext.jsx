'use client'

import { createContext, useContext } from 'react'
import { usePresence } from '@/hooks/usePresence'

const PresenceContext = createContext({ isOnline: () => false, onlineUsers: new Set() })

// Must be rendered inside SocketProvider so usePresence can access the socket
export function PresenceProvider({ children }) {
  const presence = usePresence()
  return <PresenceContext.Provider value={presence}>{children}</PresenceContext.Provider>
}

export function usePresenceContext() {
  return useContext(PresenceContext)
}
