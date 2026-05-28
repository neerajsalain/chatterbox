import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Message from '@/models/Message'
import Conversation from '@/models/Conversation'
import { MESSAGES_PER_PAGE } from '@/utils/constants'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { convId } = await params
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? String(MESSAGES_PER_PAGE), 10))

  await connectDB()

  const conv = await Conversation.findById(convId).select('participants').lean()
  if (!conv) return Response.json({ error: 'Conversation not found' }, { status: 404 })
  if (!conv.participants.some((p) => p.toString() === session.user.id)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [messages, total] = await Promise.all([
    Message.find({ conversation: convId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name image status')
      .lean(),
    Message.countDocuments({ conversation: convId }),
  ])

  return Response.json({
    messages,
    pagination: { page, limit, total, hasMore: page * limit < total },
  })
}
