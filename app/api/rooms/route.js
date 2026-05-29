import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import Room from '@/models/Room'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(80).trim(),
  description: z.string().max(200).trim().optional().default(''),
  isPrivate: z.boolean().optional().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    const rooms = await Room.find({
      $or: [{ isPrivate: false }, { members: session.user.id }],
    })
      .select('name description image members admin isPrivate createdAt')
      .populate('admin', 'name image')
      .sort({ createdAt: -1 })
      .lean()

    return Response.json({ rooms })
  } catch (err) {
    console.error('GET /api/rooms:', err)
    return Response.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  try {
    await connectDB()

    const room = await Room.create({
      ...parsed.data,
      admin: session.user.id,
      members: [session.user.id],
    })

    return Response.json(room.toJSON(), { status: 201 })
  } catch (err) {
    console.error('POST /api/rooms:', err)
    return Response.json({ error: 'Failed to create room' }, { status: 500 })
  }
}
