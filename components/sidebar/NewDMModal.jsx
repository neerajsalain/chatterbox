'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import Modal from '@/components/shared/Modal'
import Avatar from '@/components/shared/Avatar'
import { usePresenceContext } from '@/context/PresenceContext'

export default function NewDMModal({ onClose, onConversationCreated }) {
  const router = useRouter()
  const { isOnline } = usePresenceContext()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    axios.get('/api/users')
      .then((res) => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function startDM(recipientId) {
    setStarting(recipientId)
    try {
      const { data } = await axios.post('/api/conversations', { recipientId })
      onConversationCreated(data)
      onClose()
      router.push(`/chat/dm/${data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.error ?? err.message ?? 'Failed to start conversation')
    } finally {
      setStarting(null)
    }
  }

  const filtered = search.trim()
    ? users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase()))
    : users

  return (
    <Modal title="New Direct Message" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
        />

        <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto scrollbar-thin -mx-1 px-1">
          {loading && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
              Loading users…
            </p>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
              No users found
            </p>
          )}

          {filtered.map((user) => {
            const online = isOnline(String(user._id))
            const isBusy = starting === user._id

            return (
              <button
                key={user._id}
                onClick={() => startDM(user._id)}
                disabled={!!starting}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors disabled:opacity-50"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Avatar src={user.image} name={user.name} size={34} online={online} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {user.name}
                  </p>
                  <p className="text-xs" style={{ color: online ? 'var(--color-online)' : 'var(--color-text-subtle)' }}>
                    {online ? 'Online' : 'Offline'}
                  </p>
                </div>
                {isBusy && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    Opening…
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
