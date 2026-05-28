import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Room from '@/models/Room'

export const dynamic = 'force-dynamic'

export async function GET(_req, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await connectDB()

  const room = await Room.findById(id)
    .populate('members', 'name image status lastSeen')
    .populate('admin', 'name image')
    .lean()

  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })

  if (room.isPrivate && !room.members.some((m) => m._id.toString() === session.user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return Response.json(room)
}
