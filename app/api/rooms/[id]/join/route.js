import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Room from '@/models/Room'

export const dynamic = 'force-dynamic'

export async function POST(_req, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  if (!mongoose.isValidObjectId(id)) {
    return Response.json({ error: 'Invalid room ID' }, { status: 400 })
  }

  try {
    await connectDB()

    const room = await Room.findById(id)
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
    if (room.isPrivate) return Response.json({ error: 'Cannot join a private room directly' }, { status: 403 })

    await Room.findByIdAndUpdate(id, { $addToSet: { members: session.user.id } })

    return Response.json({ success: true })
  } catch (err) {
    console.error('POST /api/rooms/[id]/join:', err)
    return Response.json({ error: 'Failed to join room' }, { status: 500 })
  }
}
