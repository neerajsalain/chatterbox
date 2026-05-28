'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { useSocket } from '@/context/SocketContext'
import { usePresenceContext } from '@/context/PresenceContext'
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

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [headerInfo, setHeaderInfo] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const bottomRef = useRef(null)
  const markedRead = useRef(new Set()) // track emitted mark_read to avoid duplicates

  const myId = session?.user?.id ?? ''

  // ── Fetch header + history ──────────────────────────────
  useEffect(() => {
    if (!roomId) return
    setLoading(true)
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
        setMessages([...m.data.messages].reverse())
      })
      .catch(console.error)
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

    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, onMessage)
    socket.on(SOCKET_EVENTS.USER_TYPING, onTyping)
    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, onStopTyping)
    socket.on(SOCKET_EVENTS.MESSAGE_READ, onMessageRead)

    return () => {
      if (targetType === 'room') socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId })
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, onMessage)
      socket.off(SOCKET_EVENTS.USER_TYPING, onTyping)
      socket.off(SOCKET_EVENTS.USER_STOP_TYPING, onStopTyping)
      socket.off(SOCKET_EVENTS.MESSAGE_READ, onMessageRead)
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
