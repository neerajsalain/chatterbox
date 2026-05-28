const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { registerSocketHandlers } = require('./socket/index')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)

// In production the allowed Socket.io origin is the canonical app URL.
// In development it's localhost. Credentials mode requires an explicit origin.
const allowedOrigin = dev
  ? ['http://localhost:3000', 'http://localhost:3001']
  : process.env.NEXT_PUBLIC_SOCKET_URL || '*'

const app = next({ dev, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Request handler error:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  registerSocketHandlers(io)

  httpServer
    .once('error', (err) => {
      console.error('HTTP server error:', err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port} [${dev ? 'dev' : 'production'}]`)
    })
})
