'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { data: session, status } = useSession()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
      auth: { userId: session.user.id },
      transports: ['websocket', 'polling'],
    })

    s.on('connect_error', (err) => console.error('Socket error:', err.message))

    setSocket(s)

    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [status, session?.user?.id])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export function useSocket() {
  return useContext(SocketContext)
}
