import { z } from 'zod'
import mongoose from 'mongoose'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Conversation from '@/models/Conversation'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const conversations = await Conversation.find({ participants: session.user.id })
      .populate('participants', 'name image status lastSeen')
      .populate({ path: 'lastMessage', select: 'content type createdAt sender' })
      .sort({ updatedAt: -1 })
      .lean()

    return Response.json({ conversations })
  } catch (err) {
    console.error('GET /api/conversations:', err)
    return Response.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: 'Invalid recipient ID' }
)

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = z.object({ recipientId: objectIdSchema }).safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { recipientId } = parsed.data
  if (recipientId === session.user.id) {
    return Response.json({ error: 'Cannot start a conversation with yourself' }, { status: 400 })
  }

  try {
    await connectDB()

    const recipient = await User.findById(recipientId).select('_id').lean()
    if (!recipient) return Response.json({ error: 'User not found' }, { status: 404 })

    const myOid = new mongoose.Types.ObjectId(session.user.id)
    const theirOid = new mongoose.Types.ObjectId(recipientId)

    // Find existing conversation first — works regardless of participant order in DB
    let conv = await Conversation.findOne({
      participants: { $all: [myOid, theirOid], $size: 2 },
    }).populate('participants', 'name image status lastSeen')

    if (conv) {
      return Response.json(conv, { status: 200 })
    }

    // No existing conversation — create a new one.
    // The pre-save hook sorts participants, ensuring consistent index order.
    conv = await Conversation.create({ participants: [myOid, theirOid] })
    conv = await conv.populate('participants', 'name image status lastSeen')

    return Response.json(conv, { status: 201 })
  } catch (err) {
    console.error('POST /api/conversations error:', err.message)
    // E11000: two concurrent requests created the same conversation — just return it
    if (err.code === 11000) {
      try {
        const myOid = new mongoose.Types.ObjectId(session.user.id)
        const theirOid = new mongoose.Types.ObjectId(recipientId)
        const existing = await Conversation.findOne({
          participants: { $all: [myOid, theirOid], $size: 2 },
        }).populate('participants', 'name image status lastSeen')
        if (existing) return Response.json(existing, { status: 200 })
      } catch (innerErr) {
        console.error('POST /api/conversations E11000 fallback error:', innerErr.message)
      }
    }
    return Response.json({ error: err.message || 'Failed to start conversation' }, { status: 500 })
  }
}
