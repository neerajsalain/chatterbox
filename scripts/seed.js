/**
 * Seed script — run once after first deploy to create default rooms.
 * Usage:  node scripts/seed.js
 * Requires MONGODB_URI in .env.local (locally) or environment (on Render).
 */

require('dotenv').config({ path: '.env.local' })

const mongoose = require('mongoose')
const User = require('../models/User')
const Room = require('../models/Room')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Add it to .env.local')
  process.exit(1)
}

const DEFAULT_ROOMS = [
  { name: 'general',      description: 'General discussion for everyone' },
  { name: 'random',       description: 'Random thoughts and off-topic chat' },
  { name: 'introductions', description: 'Say hello and introduce yourself' },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅  Connected to MongoDB')

  // Find or create a system bot user that owns the default rooms
  let botUser = await User.findOne({ email: 'system@chatterbox.app' })
  if (!botUser) {
    botUser = await User.create({
      name: 'ChatterBox',
      email: 'system@chatterbox.app',
      password: require('crypto').randomBytes(32).toString('hex'), // random unusable password
      image: '',
    })
    console.log('✅  Created system bot user')
  } else {
    console.log('ℹ️   System bot user already exists')
  }

  // Create each default room if it doesn't already exist
  let created = 0
  for (const roomData of DEFAULT_ROOMS) {
    const exists = await Room.findOne({ name: roomData.name })
    if (!exists) {
      await Room.create({
        name: roomData.name,
        description: roomData.description,
        admin: botUser._id,
        members: [botUser._id],
        isPrivate: false,
      })
      console.log(`✅  Created room: #${roomData.name}`)
      created++
    } else {
      console.log(`ℹ️   Room already exists: #${roomData.name}`)
    }
  }

  console.log(`\n🎉  Seeding complete — ${created} room(s) created`)
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
