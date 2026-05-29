'use client'

import { useState, useRef, useEffect } from 'react'
import { formatMessageTime } from '@/utils/formatTime'
import Avatar from '@/components/shared/Avatar'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👎']

// ── Read receipt ──────────────────────────────────────────
function ReadReceipt({ readBy, myId }) {
  const isRead = (readBy ?? []).filter(id => String(id) !== myId).length > 0
  return (
    <span className="inline-flex items-center" aria-label={isRead ? 'Read' : 'Sent'}>
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <path d="M1 5l3 3 7-7" stroke={isRead ? 'var(--color-read)' : 'var(--color-sent)'}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ marginLeft: -5 }}>
        <path d="M1 5l3 3 7-7" stroke={isRead ? 'var(--color-read)' : 'transparent'}
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// ── File card ─────────────────────────────────────────────
function FileCard({ url, fileName, isOwn }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
       className="flex items-center gap-2.5 px-4 py-3 rounded-2xl no-underline transition-opacity hover:opacity-80"
       style={{ background: isOwn ? 'var(--color-bubble-sent)' : 'var(--color-bubble-received)', maxWidth: 260 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           style={{ flexShrink: 0, color: isOwn ? 'rgba(255,255,255,0.85)' : 'var(--color-text-muted)' }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm truncate" style={{ color: isOwn ? 'white' : 'var(--color-text)', maxWidth: 180 }}>
        {fileName || 'Download file'}
      </span>
    </a>
  )
}

// ── Reaction chips ────────────────────────────────────────
function ReactionBar({ reactions, myId, onReact }) {
  if (!reactions || reactions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(r => {
        const count = r.users?.length ?? 0
        if (count === 0) return null
        const reacted = r.users?.some(u => String(u) === myId || String(u?._id) === myId)
        return (
          <button
            key={r.emoji}
            onClick={() => onReact?.(r.emoji)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all"
            style={{
              background: reacted ? 'var(--color-primary)' : 'var(--color-surface-2)',
              color: reacted ? 'white' : 'var(--color-text)',
              border: `1px solid ${reacted ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            <span>{r.emoji}</span>
            <span>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Quick emoji picker ────────────────────────────────────
function QuickReactions({ onReact, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [onClose])

  return (
    <div ref={ref}
         className="absolute z-50 flex gap-1 px-2 py-1.5 rounded-2xl shadow-lg"
         style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', bottom: '110%', left: 0 }}>
      {QUICK_EMOJIS.map(e => (
        <button key={e} onClick={() => { onReact(e); onClose() }}
                className="text-lg hover:scale-125 transition-transform">
          {e}
        </button>
      ))}
    </div>
  )
}

// ── ⋮ message menu ────────────────────────────────────────
function MessageMenu({ onDelete, onEdit, onReact }) {
  const [open, setOpen] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open && !showReactions) return
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false); setShowReactions(false); setConfirmDelete(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open, showReactions])

  function handleDeleteClick() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(); setOpen(false); setConfirmDelete(false)
  }

  return (
    <div className="relative self-center flex-shrink-0" ref={ref}>
      <button
        onClick={() => { setOpen(v => !v); setShowReactions(false); setConfirmDelete(false) }}
        aria-label="Message options"
        className="flex items-center justify-center w-6 h-6 rounded-full transition-colors"
        style={{ color: 'var(--color-text-subtle)', background: open ? 'var(--color-surface-2)' : 'transparent' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 rounded-xl shadow-lg py-1 min-w-[160px]"
             style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)', bottom: '110%', marginBottom: 2 }}>

          {/* React */}
          <button onClick={() => { setShowReactions(true); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-text)' }}>
            <span className="text-base">😊</span> React
          </button>

          {/* Edit */}
          {onEdit && (
            <button onClick={() => { onEdit(); setOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--color-text)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit
            </button>
          )}

          {/* Delete */}
          <button onClick={handleDeleteClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:opacity-70 transition-opacity"
                  style={{ color: '#ef4444' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {confirmDelete ? 'Tap to confirm' : 'Delete'}
          </button>
        </div>
      )}

      {showReactions && (
        <QuickReactions onReact={onReact} onClose={() => setShowReactions(false)} />
      )}
    </div>
  )
}

// ── Inline edit input ─────────────────────────────────────
function EditInput({ initialValue, onSave, onCancel }) {
  const [value, setValue] = useState(initialValue)
  const ref = useRef(null)

  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim()) onSave(value.trim()) }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKey}
        rows={2}
        className="text-sm rounded-xl px-3 py-2 resize-none outline-none"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-primary)',
          color: 'var(--color-text)',
          minWidth: 180,
        }}
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs px-2 py-1 rounded-lg"
                style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
          Cancel
        </button>
        <button onClick={() => value.trim() && onSave(value.trim())}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'var(--color-primary)', color: 'white' }}>
          Save
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>Enter to save · Esc to cancel</p>
    </div>
  )
}

// ── Deleted placeholder ───────────────────────────────────
function DeletedBubble({ isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'items-end gap-2'} mb-1`}>
      {!isOwn && <div className="w-7 flex-shrink-0" />}
      <div className="px-4 py-2.5 rounded-2xl text-sm italic"
           style={{
             background: isOwn ? 'var(--color-bubble-sent)' : 'var(--color-bubble-received)',
             color: isOwn ? 'rgba(255,255,255,0.5)' : 'var(--color-text-subtle)',
             maxWidth: '70%',
           }}>
        🚫 This message was deleted
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────
export default function MessageBubble({ message, isOwn, showAvatar, myId, onDelete, onEdit, onReact }) {
  const { sender, content, type, fileUrl, fileName, readBy, createdAt, deleted, edited, reactions } = message
  const [editing, setEditing] = useState(false)

  if (deleted) return <DeletedBubble isOwn={isOwn} />

  function handleReact(emoji) { onReact?.(String(message._id), emoji) }

  // ── Received message ──
  if (!isOwn) {
    return (
      <div className="flex items-end gap-2 mb-1">
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
              <img src={fileUrl} alt={fileName || 'image'} className="rounded-2xl rounded-tl-sm max-w-full object-cover cursor-pointer" />
            </a>
          ) : type === 'file' ? (
            <FileCard url={fileUrl} fileName={fileName} isOwn={false} />
          ) : (
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
                 style={{ background: 'var(--color-bubble-received)', color: 'var(--color-text)' }}>
              {content}
            </div>
          )}
          {edited && <p className="text-xs pl-1 mt-0.5 italic" style={{ color: 'var(--color-text-subtle)' }}>edited</p>}
          <ReactionBar reactions={reactions} myId={myId} onReact={handleReact} />
          <div className="flex items-center gap-2 mt-0.5 pl-1">
            <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{formatMessageTime(createdAt)}</p>
            {/* React button for received messages */}
            <ReactButton onReact={handleReact} />
          </div>
        </div>
      </div>
    )
  }

  // ── Own message ──
  return (
    <div className="flex justify-end items-end gap-1.5 mb-1">
      {/* ⋮ menu */}
      {(onDelete || onEdit || onReact) && (
        <MessageMenu
          onDelete={onDelete ? () => onDelete(String(message._id)) : null}
          onEdit={onEdit && type === 'text' && !deleted ? () => setEditing(true) : null}
          onReact={handleReact}
        />
      )}

      <div className="max-w-[70%]">
        {editing ? (
          <EditInput
            initialValue={content}
            onSave={v => { onEdit(String(message._id), v); setEditing(false) }}
            onCancel={() => setEditing(false)}
          />
        ) : type === 'image' ? (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <img src={fileUrl} alt={fileName || 'image'} className="rounded-2xl rounded-tr-sm max-w-full object-cover cursor-pointer" />
          </a>
        ) : type === 'file' ? (
          <FileCard url={fileUrl} fileName={fileName} isOwn />
        ) : (
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
               style={{ background: 'var(--color-bubble-sent)', color: 'white' }}>
            {content}
          </div>
        )}
        {edited && !editing && <p className="text-xs text-right mt-0.5 italic" style={{ color: 'rgba(255,255,255,0.55)' }}>edited</p>}
        <ReactionBar reactions={reactions} myId={myId} onReact={handleReact} />
        {!editing && (
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>{formatMessageTime(createdAt)}</span>
            <ReadReceipt readBy={readBy} myId={myId} />
          </div>
        )}
      </div>
    </div>
  )
}

// Small react button for received messages
function ReactButton({ onReact }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setShow(v => !v)} className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-subtle)' }} aria-label="React">
        😊
      </button>
      {show && <QuickReactions onReact={onReact} onClose={() => setShow(false)} />}
    </div>
  )
}
