import { useState, useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { SOCKET_EVENTS } from '@/utils/constants'

export function usePresence() {
  const socket = useSocket()
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (!socket) return

    const onOnline = ({ userId }) =>
      setOnlineUsers((prev) => new Set([...prev, userId]))

    const onOffline = ({ userId }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })

    socket.on(SOCKET_EVENTS.USER_ONLINE, onOnline)
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onOffline)

    return () => {
      socket.off(SOCKET_EVENTS.USER_ONLINE, onOnline)
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onOffline)
    }
  }, [socket])

  const isOnline = (userId) => onlineUsers.has(userId)

  return { onlineUsers, isOnline }
}
