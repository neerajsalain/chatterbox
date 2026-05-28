import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Room from '@/models/Room'

export const dynamic = 'force-dynamic'

export async function POST(_req, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = session.user.id

  await connectDB()

  const room = await Room.findById(id)
  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })

  // If the admin is the only member, delete the room
  const remainingMembers = room.members.filter((m) => m.toString() !== userId)
  if (remainingMembers.length === 0) {
    await room.deleteOne()
    return Response.json({ success: true, deleted: true })
  }

  // Transfer admin if the admin is leaving
  const update = { $pull: { members: userId } }
  if (room.admin.toString() === userId) {
    update.$set = { admin: remainingMembers[0] }
  }

  await Room.findByIdAndUpdate(id, update)

  return Response.json({ success: true })
}
