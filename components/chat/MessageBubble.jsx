'use client'

import { useState, useRef, useEffect } from 'react'
import { formatMessageTime } from '@/utils/formatTime'
import Avatar from '@/components/shared/Avatar'

// ── Read receipt checkmarks ───────────────────────────────
function ReadReceipt({ readBy, myId }) {
  const readByOthers = readBy?.filter((id) => String(id) !== myId) ?? []
  const isRead = readByOthers.length > 0
  return (
    <span className="inline-flex items-center gap-0" aria-label={isRead ? 'Read' : 'Sent'}>
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <path d="M1 5l3 3 7-7" stroke={isRead ? 'var(--color-read)' : 'var(--color-sent)'}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ marginLeft: -5 }}>
        <path d="M1 5l3 3 7-7"
              stroke={isRead ? 'var(--color-read)' : 'transparent'}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// ── File attachment card ──────────────────────────────────
function FileCard({ url, fileName, isOwn }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="flex items-center gap-2.5 px-4 py-3 rounded-2xl no-underline transition-opacity hover:opacity-80"
       style={{ background: isOwn ? 'var(--color-bubble-sent)' : 'var(--color-bubble-received)', maxWidth: 260 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"
           style={{ flexShrink: 0, color: isOwn ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm truncate" style={{ color: isOwn ? 'white' : 'var(--color-text)', maxWidth: 180 }}>
        {fileName || 'Download file'}
      </span>
    </a>
  )
}

// ── Message action menu (⋮) ───────────────────────────────
function MessageMenu({ onDelete, isOwn }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [open])

  function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    onDelete()
    setOpen(false)
    setConfirming(false)
  }

  return (
    <div className="relative flex-shrink-0 self-center" ref={menuRef}>
      {/* ⋮ trigger — always visible on mobile, hover-only on desktop */}
      <button
        onClick={() => { setOpen((v) => !v); setConfirming(false) }}
        aria-label="Message options"
        className={[
          'p-1.5 rounded-full transition-all',
          'opacity-100 md:opacity-0 md:group-hover:opacity-100',
          open ? 'opacity-100' : '',
        ].join(' ')}
        style={{ color: 'var(--color-text-subtle)', background: open ? 'var(--color-surface-2)' : 'transparent' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 rounded-xl shadow-lg py-1 min-w-[130px]"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            // Align right for own messages, left for received
            ...(isOwn ? { right: 0 } : { left: 0 }),
            bottom: '100%',
            marginBottom: 4,
          }}
        >
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors hover:opacity-80"
            style={{ color: confirming ? '#ef4444' : '#ef4444' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {confirming ? 'Tap to confirm' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Deleted placeholder ───────────────────────────────────
function DeletedBubble({ isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'items-end gap-2'} mb-1`}>
      {!isOwn && <div className="w-7 flex-shrink-0" />}
      <div
        className="px-4 py-2.5 rounded-2xl text-sm italic"
        style={{
          background: isOwn ? 'var(--color-bubble-sent)' : 'var(--color-bubble-received)',
          color: isOwn ? 'rgba(255,255,255,0.5)' : 'var(--color-text-subtle)',
          maxWidth: '70%',
        }}
      >
        🚫 This message was deleted
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function MessageBubble({ message, isOwn, showAvatar, myId, onDelete }) {
  const { sender, content, type, fileUrl, fileName, readBy, createdAt, deleted } = message

  if (deleted) return <DeletedBubble isOwn={isOwn} />

  const menu = onDelete
    ? <MessageMenu onDelete={() => onDelete(String(message._id))} isOwn={isOwn} />
    : null

  if (isOwn) {
    return (
      <div className="flex justify-end items-end gap-1 mb-1 group">
        {/* Menu sits to the left of own bubble */}
        {menu}

        <div className="max-w-[70%]">
          {type === 'image' ? (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <img src={fileUrl} alt={fileName || 'image'}
                   className="rounded-2xl rounded-tr-sm max-w-full object-cover cursor-pointer" />
            </a>
          ) : type === 'file' ? (
            <FileCard url={fileUrl} fileName={fileName} isOwn />
          ) : (
            <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                 style={{ background: 'var(--color-bubble-sent)', color: 'white' }}>
              {content}
            </div>
          )}
          <div className="flex items-center justify-end gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
              {formatMessageTime(createdAt)}
            </span>
            <ReadReceipt readBy={readBy} myId={myId} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 mb-1 group">
      <div className="w-7 h-7 flex-shrink-0 self-end">
        {showAvatar && <Avatar src={sender?.image} name={sender?.name} size={28} />}
      </div>
      <div className="max-w-[70%]">
        {showAvatar && (
          <p className="text-xs mb-1 font-medium pl-1" style={{ color: 'var(--color-text-muted)' }}>
            {sender?.name}
          </p>
        )}
        {type === 'image' ? (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <img src={fileUrl} alt={fileName || 'image'}
                 className="rounded-2xl rounded-tl-sm max-w-full object-cover cursor-pointer" />
          </a>
        ) : type === 'file' ? (
          <FileCard url={fileUrl} fileName={fileName} isOwn={false} />
        ) : (
          <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
               style={{ background: 'var(--color-bubble-received)', color: 'var(--color-text)' }}>
            {content}
          </div>
        )}
        <p className="text-xs mt-0.5 pl-1 opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ color: 'var(--color-text-subtle)' }}>
          {formatMessageTime(createdAt)}
        </p>
      </div>
    </div>
  )
}
