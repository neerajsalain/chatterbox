const mongoose = require('mongoose')
const connectDB = require('../lib/db')
const Message = require('../models/Message')
const Room = require('../models/Room')
const Conversation = require('../models/Conversation')

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

function registerChatEvents(io, socket) {
  // ── Join room — verify membership for private rooms ────────────────────────
  socket.on('join_room', async ({ roomId }) => {
    if (!isValidId(roomId)) return
    try {
      await connectDB()
      const room = await Room.findById(roomId).select('members isPrivate').lean()
      if (!room) return
      if (room.isPrivate && !room.members.some((m) => m.toString() === socket.userId)) return
      socket.join(`room:${roomId}`)
    } catch {
      // Fail silently — client just won't receive messages for this room
    }
  })

  socket.on('leave_room', ({ roomId }) => {
    if (!isValidId(roomId)) return
    socket.leave(`room:${roomId}`)
  })

  // ── Join conversation — verify the user is a participant ───────────────────
  socket.on('join_conversation', async ({ conversationId }) => {
    if (!isValidId(conversationId)) return
    try {
      await connectDB()
      const conv = await Conversation.findById(conversationId).select('participants').lean()
      if (!conv) return
      if (!conv.participants.some((p) => p.toString() === socket.userId)) return
      socket.join(`conv:${conversationId}`)
    } catch {
      // Fail silently
    }
  })

  // ── Send message ───────────────────────────────────────────────────────────
  socket.on('send_message', async (payload) => {
    const { targetId, targetType, content = '', type = 'text', fileUrl = '', fileName = '' } = payload ?? {}

    if (!targetId || !targetType || !isValidId(targetId)) {
      return socket.emit('error', { message: 'Invalid message payload' })
    }
    if (type === 'text' && !content.trim()) {
      return socket.emit('error', { message: 'Message content cannot be empty' })
    }

    // Use the socket's joined channels as an authorization cache —
    // join_room / join_conversation already verified membership via DB
    const channel = targetType === 'room' ? `room:${targetId}` : `conv:${targetId}`
    if (!socket.rooms.has(channel)) {
      return socket.emit('error', { message: 'Not authorized to send messages here' })
    }

    try {
      await connectDB()

      const messageData = {
        sender: socket.userId,
        content: content.trim(),
        type,
        fileUrl,
        fileName,
        readBy: [socket.userId],
        ...(targetType === 'room'
          ? { room: targetId }
          : { conversation: targetId }),
      }

      const message = await Message.create(messageData)
      const populated = await message.populate('sender', 'name image status')

      if (targetType === 'conversation') {
        await Conversation.findByIdAndUpdate(targetId, { lastMessage: message._id })
        io.to(`conv:${targetId}`).emit('receive_message', populated)
      } else {
        io.to(`room:${targetId}`).emit('receive_message', populated)
      }
    } catch (err) {
      console.error('send_message error:', err.message)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // ── Mark read ──────────────────────────────────────────────────────────────
  socket.on('mark_read', async ({ messageId }) => {
    if (!messageId || !isValidId(messageId)) return
    try {
      await connectDB()
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { readBy: socket.userId } }
      ).select('room conversation')
      if (!msg) return
      const target = msg.room ? `room:${msg.room}` : `conv:${msg.conversation}`
      socket.to(target).emit('message_read', { messageId, userId: socket.userId })
    } catch {
      // Best-effort — read receipts are non-critical
    }
  })
}

module.exports = registerChatEvents
