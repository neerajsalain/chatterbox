const connectDB = require('../lib/db')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')

function registerChatEvents(io, socket) {
  socket.on('join_room', ({ roomId }) => {
    socket.join(`room:${roomId}`)
  })

  socket.on('leave_room', ({ roomId }) => {
    socket.leave(`room:${roomId}`)
  })

  socket.on('join_conversation', ({ conversationId }) => {
    socket.join(`conv:${conversationId}`)
  })

  socket.on('send_message', async (payload) => {
    const { targetId, targetType, content = '', type = 'text', fileUrl = '', fileName = '' } = payload ?? {}

    if (!targetId || !targetType) {
      return socket.emit('error', { message: 'Invalid message payload' })
    }
    if (type === 'text' && !content.trim()) {
      return socket.emit('error', { message: 'Message content cannot be empty' })
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

  socket.on('mark_read', async ({ messageId }) => {
    if (!messageId) return
    try {
      await connectDB()
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: socket.userId },
      })
      socket.broadcast.emit('message_read', { messageId, userId: socket.userId })
    } catch {
      // Best-effort — read receipts are non-critical
    }
  })
}

module.exports = registerChatEvents
