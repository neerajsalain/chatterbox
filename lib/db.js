const mongoose = require('mongoose')

// Singleton: cache connection across Next.js hot reloads and socket handler requires
let cached = global._mongooseCache
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not defined')

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }

  return cached.conn
}

module.exports = connectDB
