import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Conversation from '@/models/Conversation'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const conversations = await Conversation.find({ participants: session.user.id })
    .populate('participants', 'name image status lastSeen')
    .populate({ path: 'lastMessage', select: 'content type createdAt sender' })
    .sort({ updatedAt: -1 })
    .lean()

  return Response.json({ conversations })
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = z.object({ recipientId: z.string().min(1) }).safeParse(body)
  if (!parsed.success) return Response.json({ error: 'recipientId is required' }, { status: 400 })

  const { recipientId } = parsed.data
  if (recipientId === session.user.id) {
    return Response.json({ error: 'Cannot start a conversation with yourself' }, { status: 400 })
  }

  await connectDB()

  const recipient = await User.findById(recipientId).select('_id').lean()
  if (!recipient) return Response.json({ error: 'User not found' }, { status: 404 })

  // findOneAndUpdate with upsert is atomic — prevents duplicate conversations
  const participants = [session.user.id, recipientId].sort()
  const conv = await Conversation.findOneAndUpdate(
    { participants: { $all: participants, $size: 2 } },
    { $setOnInsert: { participants } },
    { upsert: true, new: true }
  ).populate('participants', 'name image status lastSeen')

  return Response.json(conv, { status: 201 })
}
