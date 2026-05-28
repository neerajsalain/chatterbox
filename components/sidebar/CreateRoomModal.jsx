'use client'

import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Modal from '@/components/shared/Modal'

const inputCls = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: '10px',
  padding: '8px 12px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
}

export default function CreateRoomModal({ onClose, onCreated }) {
  const [fields, setFields] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fields.name.trim()) return
    setLoading(true)
    try {
      const { data } = await axios.post('/api/rooms', fields)
      toast.success(`Room #${data.name} created!`)
      onCreated(data)
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Create a Room" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider"
                 style={{ color: 'var(--color-text-muted)' }}>
            Room Name *
          </label>
          <input
            type="text"
            required
            maxLength={80}
            placeholder="e.g. general"
            value={fields.name}
            onChange={set('name')}
            style={inputCls}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider"
                 style={{ color: 'var(--color-text-muted)' }}>
            Description <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            maxLength={200}
            placeholder="What's this room about?"
            value={fields.description}
            onChange={set('description')}
            style={inputCls}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !fields.name.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {loading ? 'Creating…' : 'Create Room'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
