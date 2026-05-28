const connectDB = require('../lib/db')
const User = require('../models/User')

function registerPresenceEvents(io, socket, userSockets) {
  const { userId } = socket

  // Announce online only on the user's first socket connection (not subsequent tabs)
  if (userSockets.get(userId)?.size === 1) {
    io.emit('user_online', { userId })
    connectDB()
      .then(() => User.findByIdAndUpdate(userId, { status: 'online' }))
      .catch((err) => console.error('Presence online update failed:', err.message))
  }

  socket.on('typing_start', ({ targetId }) => {
    if (!targetId) return
    socket
      .to(`room:${targetId}`)
      .to(`conv:${targetId}`)
      .emit('user_typing', { userId, socketId: socket.id })
  })

  socket.on('typing_stop', ({ targetId }) => {
    if (!targetId) return
    socket
      .to(`room:${targetId}`)
      .to(`conv:${targetId}`)
      .emit('user_stop_typing', { userId })
  })

  // Announce offline only when the user's last socket disconnects
  socket.on('disconnect', async () => {
    if (!userSockets.has(userId)) {
      const lastSeen = new Date()
      io.emit('user_offline', { userId, lastSeen })
      try {
        await connectDB()
        await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen })
      } catch (err) {
        console.error('Presence offline update failed:', err.message)
      }
    }
  })
}

module.exports = registerPresenceEvents
