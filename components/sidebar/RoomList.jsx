'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function RoomList({ rooms, loading, onNavigate }) {
  const router = useRouter()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="px-2 flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-lg animate-pulse"
            style={{ background: 'var(--color-surface-2)', opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <p className="px-4 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
        No rooms yet — create one!
      </p>
    )
  }

  return (
    <ul className="px-2 flex flex-col gap-0.5">
      {rooms.map((room) => {
        const href = `/chat/room/${room._id}`
        const isActive = pathname === href

        return (
          <li key={room._id}>
            <button
              onClick={() => { router.push(href); onNavigate?.() }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm transition-colors"
              style={{
                background: isActive ? 'var(--color-surface-2)' : 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--color-surface-2)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>#</span>
              <span className="truncate">{room.name}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
