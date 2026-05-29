'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Avatar from '@/components/shared/Avatar'
import { usePresenceContext } from '@/context/PresenceContext'

export default function DMList({ conversations, loading, onNavigate }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isOnline } = usePresenceContext()

  const myId = session?.user?.id

  if (loading) {
    return (
      <div className="px-2 flex flex-col gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-9 rounded-lg animate-pulse"
            style={{ background: 'var(--color-surface-2)', opacity: 1 - i * 0.25 }}
          />
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <p className="px-4 text-xs" style={{ color: 'var(--color-text-subtle)' }}>
        No direct messages yet
      </p>
    )
  }

  return (
    <ul className="px-2 flex flex-col gap-0.5">
      {conversations.map((conv) => {
        const other = conv.participants?.find((p) => String(p._id) !== myId)
        const href = `/chat/dm/${conv._id}`
        const isActive = pathname === href
        const online = other ? isOnline(String(other._id)) : false

        return (
          <li key={conv._id}>
            <button
              onClick={() => { router.push(href); onNavigate?.() }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left text-sm transition-colors"
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
              <Avatar src={other?.image} name={other?.name} size={22} online={online} />
              <span className="truncate">{other?.name ?? 'Unknown'}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
