import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Conversation from '@/models/Conversation'

export const dynamic = 'force-dynamic'

export async function GET(_req, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  if (!mongoose.isValidObjectId(id)) {
    return Response.json({ error: 'Invalid conversation ID' }, { status: 400 })
  }

  try {
    await connectDB()

    const conv = await Conversation.findById(id)
      .populate('participants', 'name image status lastSeen')
      .lean()

    if (!conv) return Response.json({ error: 'Not found' }, { status: 404 })

    if (!conv.participants.some((p) => String(p._id) === session.user.id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json(conv)
  } catch (err) {
    console.error('GET /api/conversations/[id]:', err)
    return Response.json({ error: 'Failed to load conversation' }, { status: 500 })
  }
}
