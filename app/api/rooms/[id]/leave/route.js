import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Room from '@/models/Room'

export const dynamic = 'force-dynamic'

export async function POST(_req, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = session.user.id

  if (!mongoose.isValidObjectId(id)) {
    return Response.json({ error: 'Invalid room ID' }, { status: 400 })
  }

  try {
    await connectDB()

    const room = await Room.findById(id)
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })

    const isMember = room.members.some((m) => m.toString() === userId)
    if (!isMember) return Response.json({ error: 'Not a member of this room' }, { status: 400 })

    // If the user is the only member, delete the room entirely
    const remainingMembers = room.members.filter((m) => m.toString() !== userId)
    if (remainingMembers.length === 0) {
      await room.deleteOne()
      return Response.json({ success: true, deleted: true })
    }

    // Transfer admin if the leaving user is the current admin
    const update = { $pull: { members: userId } }
    if (room.admin.toString() === userId) {
      update.$set = { admin: remainingMembers[0] }
    }

    await Room.findByIdAndUpdate(id, update)

    return Response.json({ success: true })
  } catch (err) {
    console.error('POST /api/rooms/[id]/leave:', err)
    return Response.json({ error: 'Failed to leave room' }, { status: 500 })
  }
}
