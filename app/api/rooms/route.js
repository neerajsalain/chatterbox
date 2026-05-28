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

  await connectDB()

  const rooms = await Room.find({
    $or: [{ isPrivate: false }, { members: session.user.id }],
  })
    .select('name description image members admin isPrivate createdAt')
    .populate('admin', 'name image')
    .sort({ createdAt: -1 })
    .lean()

  return Response.json({ rooms })
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await connectDB()

  const room = await Room.create({
    ...parsed.data,
    admin: session.user.id,
    members: [session.user.id],
  })

  return Response.json(room.toJSON(), { status: 201 })
}
