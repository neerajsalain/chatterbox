// Provides a reference to the Socket.io server instance for use in API routes.
// The instance is set once during server startup in server.js.

let _io = null

function setIO(io) {
  _io = io
}

function getIO() {
  if (!_io) throw new Error('Socket.io has not been initialized — server.js must run first')
  return _io
}

module.exports = { setIO, getIO }
