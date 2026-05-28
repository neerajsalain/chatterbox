'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import axios from 'axios'
import Avatar from '@/components/shared/Avatar'
import RoomList from './RoomList'
import DMList from './DMList'
import CreateRoomModal from './CreateRoomModal'
import NewDMModal from './NewDMModal'
import { useTheme } from '@/hooks/useTheme'

export default function Sidebar({ user }) {
  const { isDark, toggleTheme } = useTheme()
  const [rooms, setRooms] = useState([])
  const [conversations, setConversations] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(true)
  const [dmsLoading, setDmsLoading] = useState(true)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showNewDM, setShowNewDM] = useState(false)

  useEffect(() => {
    axios.get('/api/rooms')
      .then((res) => setRooms(res.data.rooms))
      .catch(console.error)
      .finally(() => setRoomsLoading(false))

    axios.get('/api/conversations')
      .then((res) => setConversations(res.data.conversations))
      .catch(console.error)
      .finally(() => setDmsLoading(false))
  }, [])

  function handleRoomCreated(room) {
    setRooms((prev) => [room, ...prev])
    setShowCreateRoom(false)
  }

  function handleConversationCreated(conv) {
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === conv._id)
      return exists ? prev : [conv, ...prev]
    })
    setShowNewDM(false)
  }

  return (
    <>
      <aside
        className="flex flex-col h-full flex-shrink-0"
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-surface-1)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        {/* App name */}
        <div
          className="flex items-center px-4 flex-shrink-0 font-bold text-sm tracking-wide"
          style={{
            height: 'var(--header-height)',
            borderBottom: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          ChatterBox
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-3 flex flex-col gap-4">

          {/* Rooms section */}
          <section className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-4">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Rooms
              </span>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 transition-opacity text-base leading-none"
                style={{ color: 'var(--color-text-muted)' }}
                title="Create room"
                aria-label="Create room"
              >
                +
              </button>
            </div>
            <RoomList rooms={rooms} loading={roomsLoading} />
          </section>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 16px' }} />

          {/* Direct Messages section */}
          <section className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-4">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Direct Messages
              </span>
              <button
                onClick={() => setShowNewDM(true)}
                className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 transition-opacity text-base leading-none"
                style={{ color: 'var(--color-text-muted)' }}
                title="New direct message"
                aria-label="New direct message"
              >
                +
              </button>
            </div>
            <DMList conversations={conversations} loading={dmsLoading} />
          </section>

        </div>

        {/* Current user footer */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 flex-shrink-0"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <Avatar src={user.image} name={user.name} size={34} online={true} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
              {user.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-online)' }}>Online</p>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </aside>

      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreated={handleRoomCreated}
        />
      )}

      {showNewDM && (
        <NewDMModal
          onClose={() => setShowNewDM(false)}
          onConversationCreated={handleConversationCreated}
        />
      )}
    </>
  )
}
