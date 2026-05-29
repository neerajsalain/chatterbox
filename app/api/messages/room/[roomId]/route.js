import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Message from '@/models/Message'
import Room from '@/models/Room'
import { MESSAGES_PER_PAGE } from '@/utils/constants'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomId } = await params

  if (!mongoose.isValidObjectId(roomId)) {
    return Response.json({ error: 'Invalid room ID' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? String(MESSAGES_PER_PAGE), 10) || MESSAGES_PER_PAGE))

  try {
    await connectDB()

    const room = await Room.findById(roomId).select('isPrivate members').lean()
    if (!room) return Response.json({ error: 'Room not found' }, { status: 404 })
    if (room.isPrivate && !room.members.some((m) => m.toString() === session.user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [messages, total] = await Promise.all([
      Message.find({ room: roomId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'name image status')
        .lean(),
      Message.countDocuments({ room: roomId }),
    ])

    return Response.json({
      messages,
      pagination: { page, limit, total, hasMore: page * limit < total },
    })
  } catch (err) {
    console.error('GET /api/messages/room/[roomId]:', err)
    return Response.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}
