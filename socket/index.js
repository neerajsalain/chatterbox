const mongoose = require('mongoose')
const { setIO } = require('../lib/socket')
const registerChatEvents = require('./chatEvents')
const registerPresenceEvents = require('./presenceEvents')
const registerNotificationEvents = require('./notificationEvents')

// userId → Set<socketId>: one user may have multiple tabs open
const userSockets = new Map()

function registerSocketHandlers(io) {
  setIO(io)

  // Auth middleware — every socket must supply a valid userId
  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId
    if (!userId) return next(new Error('Unauthorized: missing userId'))
    if (!mongoose.Types.ObjectId.isValid(userId)) return next(new Error('Unauthorized: invalid userId'))
    socket.userId = userId
    next()
  })

  io.on('connection', (socket) => {
    const { userId } = socket

    if (!userSockets.has(userId)) userSockets.set(userId, new Set())
    userSockets.get(userId).add(socket.id)

    registerChatEvents(io, socket)
    registerPresenceEvents(io, socket, userSockets)
    registerNotificationEvents(io, socket)

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) userSockets.delete(userId)
      }
    })
  })
}

module.exports = { registerSocketHandlers, userSockets }
