'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { useSocket } from '@/context/SocketContext'
import { usePresenceContext } from '@/context/PresenceContext'
import { useMobileNav } from '@/components/chat/ChatShell'
import { useNotifications } from '@/hooks/useNotifications'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import Avatar from '@/components/shared/Avatar'
import PresenceDot from '@/components/sidebar/PresenceDot'
import { SOCKET_EVENTS } from '@/utils/constants'

const getSenderId = (msg) => String(msg.sender?._id ?? msg.sender ?? '')

export default function ChatWindow({ roomId, targetType = 'room' }) {
  const { data: session } = useSession()
  const socket = useSocket()
  const { isOnline } = usePresenceContext()
  const { notify } = useNotifications()
  const { openSidebar } = useMobileNav()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [headerInfo, setHeaderInfo] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const headerMenuRef = useRef(null)
  const bottomRef = useRef(null)
  const markedRead = useRef(new Set()) // track emitted mark_read to avoid duplicates

  const myId = session?.user?.id ?? ''

  // ── Fetch header + history ──────────────────────────────
  useEffect(() => {
    if (!roomId) return
    setLoading(true)
    setLoadError(false)
    setMessages([])
    setTypingUsers([])
    setHeaderInfo(null)
    markedRead.current.clear()

    const headerUrl = targetType === 'room'
      ? `/api/rooms/${roomId}`
      : `/api/conversations/${roomId}`

    const historyUrl = targetType === 'room'
      ? `/api/messages/room/${roomId}?limit=30`
      : `/api/messages/conversation/${roomId}?limit=30`

    Promise.all([axios.get(headerUrl), axios.get(historyUrl)])
      .then(([h, m]) => {
        setHeaderInfo(h.data)
        setMessages([...(m.data?.messages ?? [])].reverse())
      })
      .catch((err) => {
        console.error('Failed to load chat:', err)
        setLoadError(true)
      })
      .finally(() => setLoading(false))
  }, [roomId, targetType])

  // ── Socket join / events ────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return

    socket.emit(
      targetType === 'room' ? SOCKET_EVENTS.JOIN_ROOM : SOCKET_EVENTS.JOIN_CONVERSATION,
      { [targetType === 'room' ? 'roomId' : 'conversationId']: roomId }
    )

    const onMessage = (msg) => {
      const target = msg.room ?? msg.conversation
      if (String(target?._id ?? target) !== roomId) return

      setMessages((prev) => [...prev, msg])

      // Browser notification when tab is hidden
      if (getSenderId(msg) !== myId) {
        notify(
          msg.sender?.name ?? 'New message',
          msg.content || '📎 Sent a file',
          msg.sender?.image
        )
      }
    }

    const onTyping = ({ userId }) => {
      if (userId !== myId) {
        setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]))
      }
    }

    const onStopTyping = ({ userId }) =>
      setTypingUsers((prev) => prev.filter((id) => id !== userId))

    // Read receipt: update readBy array of the specific message in state
    const onMessageRead = ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === messageId
            ? { ...m, readBy: [...(m.readBy ?? []), userId] }
            : m
        )
      )
    }

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => String(m._id) === messageId ? { ...m, deleted: true } : m)
      )
    }

    const onChatCleared = () => setMessages([])

    const onMessageEdited = ({ messageId, content, editedAt }) => {
      setMessages(prev => prev.map(m =>
        String(m._id) === messageId ? { ...m, content, edited: true, editedAt } : m
      ))
    }

    const onMessageReaction = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m =>
        String(m._id) === messageId ? { ...m, reactions } : m
      ))
    }

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, onMessage)
    socket.on(SOCKET_EVENTS.USER_TYPING, onTyping)
    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, onStopTyping)
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onMessageRead)
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted)
    socket.on(SOCKET_EVENTS.CHAT_CLEARED, onChatCleared)
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, onMessageEdited)
    socket.on(SOCKET_EVENTS.MESSAGE_REACTION, onMessageReaction)

    return () => {
      if (targetType === 'room') socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId })
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, onMessage)
      socket.off(SOCKET_EVENTS.USER_TYPING, onTyping)
      socket.off(SOCKET_EVENTS.USER_STOP_TYPING, onStopTyping)
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead)
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, onMessageDeleted)
      socket.off(SOCKET_EVENTS.CHAT_CLEARED, onChatCleared)
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, onMessageEdited)
      socket.off(SOCKET_EVENTS.MESSAGE_REACTION, onMessageReaction)
    }
  }, [socket, roomId, targetType, myId, notify])

  // ── Emit mark_read for messages not sent by me ──────────
  useEffect(() => {
    if (!socket || !myId || messages.length === 0) return
    messages.forEach((msg) => {
      const msgId = String(msg._id)
      if (!msgId || markedRead.current.has(msgId)) return
      if (getSenderId(msg) === myId) return // don't mark own messages
      markedRead.current.add(msgId)
      socket.emit(SOCKET_EVENTS.MARK_READ, { messageId: msgId })
    })
  }, [messages, socket, myId])

  // ── Auto-scroll ─────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typingUsers.length])

  // ── Send handlers ────────────────────────────────────────
  const handleSend = useCallback((content) => {
    socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, { targetId: roomId, targetType, content, type: 'text' })
  }, [socket, roomId, targetType])

  const handleFileSend = useCallback(({ url, type, fileName }) => {
    socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      targetId: roomId,
      targetType,
      content: '',
      type,
      fileUrl: url,
      fileName,
    })
  }, [socket, roomId, targetType])

  const handleTyping = useCallback((typing) => {
    socket?.emit(
      typing ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP,
      { targetId: roomId }
    )
  }, [socket, roomId])

  const handleDelete = useCallback((messageId) => {
    socket?.emit(SOCKET_EVENTS.DELETE_MESSAGE, { messageId })
  }, [socket])

  const handleEdit = useCallback((messageId, content) => {
    socket?.emit(SOCKET_EVENTS.EDIT_MESSAGE, { messageId, content })
  }, [socket])

  const handleReact = useCallback((messageId, emoji) => {
    socket?.emit(SOCKET_EVENTS.REACT_MESSAGE, { messageId, emoji })
  }, [socket])

  const handleClearChat = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true)
      return
    }
    socket?.emit(SOCKET_EVENTS.CLEAR_CHAT, { targetId: roomId, targetType })
    setHeaderMenuOpen(false)
    setClearConfirm(false)
  }, [socket, roomId, targetType, clearConfirm])

  // Close header menu on outside click
  useEffect(() => {
    if (!headerMenuOpen) return
    function handleOutside(e) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false)
        setClearConfirm(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [headerMenuOpen])

  // ── Derived header values ────────────────────────────────
  const otherParticipant = targetType === 'conversation'
    ? headerInfo?.participants?.find((p) => String(p._id) !== myId)
    : null

  const otherOnline = otherParticipant ? isOnline(String(otherParticipant._id)) : false

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: 'var(--color-text-muted)', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--color-danger, #ef4444)' }}>
          Failed to load. Please refresh and try again.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-5 flex-shrink-0"
        style={{
          height: 'var(--header-height)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface-1)',
        }}
      >
        {/* Back button — mobile only */}
        <button
          onClick={openSidebar}
          className="md:hidden flex-shrink-0 p-1.5 rounded-lg hover:opacity-70 transition-opacity mr-1"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Back to sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {targetType === 'room' ? (
          <>
            <span className="text-xl font-light" style={{ color: 'var(--color-text-muted)' }}>#</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                {headerInfo?.name ?? '…'}
              </h2>
              {headerInfo?.description && (
                <p className="text-xs truncate hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
                  {headerInfo.description}
                </p>
              )}
            </div>
            <span className="text-xs flex-shrink-0 hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
              {headerInfo?.members?.length ?? 0} members
            </span>
          </>
        ) : (
          <>
            <Avatar src={otherParticipant?.image} name={otherParticipant?.name} size={34} />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                {otherParticipant?.name ?? '…'}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <PresenceDot status={otherOnline ? 'online' : 'offline'} size={7} />
                <span className="text-xs"
                      style={{ color: otherOnline ? 'var(--color-online)' : 'var(--color-text-subtle)' }}>
                  {otherOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ── Header ⋮ menu ── */}
        <div className="relative flex-shrink-0 ml-auto" ref={headerMenuRef}>
          <button
            onClick={() => { setHeaderMenuOpen((v) => !v); setClearConfirm(false) }}
            aria-label="Chat options"
            className="p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>

          {headerMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-lg py-1 min-w-[150px]"
              style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-border)' }}
            >
              <button
                onClick={handleClearChat}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-opacity hover:opacity-70"
                style={{ color: clearConfirm ? '#ef4444' : '#ef4444' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {clearConfirm ? 'Tap again to confirm' : 'Clear Chat'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-sm text-center mt-10" style={{ color: 'var(--color-text-muted)' }}>
            {targetType === 'room'
              ? 'No messages yet. Be the first!'
              : `Start your conversation with ${otherParticipant?.name ?? 'this user'}`}
          </p>
        )}

        {messages.map((msg, i) => {
          const prev = messages[i - 1]
          const showAvatar = !prev || getSenderId(prev) !== getSenderId(msg)
          return (
            <MessageBubble
              key={msg._id ?? i}
              message={msg}
              isOwn={getSenderId(msg) === myId}
              showAvatar={showAvatar}
              myId={myId}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReact={handleReact}
            />
          )
        })}

        {typingUsers.length > 0 && <TypingIndicator count={typingUsers.length} />}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={handleSend} onFileSend={handleFileSend} onTyping={handleTyping} />
    </div>
  )
}
