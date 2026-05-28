import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Room from '@/models/Room'

export const dynamic = 'force-dynamic'

export async function POST(_req, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  await connectDB()

  const room = await Room.findById(id)
  if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
  if (room.isPrivate) return Response.json({ error: 'Cannot join a private room directly' }, { status: 403 })

  await Room.findByIdAndUpdate(id, { $addToSet: { members: session.user.id } })

  return Response.json({ success: true })
}
