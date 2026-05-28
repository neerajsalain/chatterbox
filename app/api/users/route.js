import { z } from 'zod'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/db'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

// List all users except self — for the DM user picker
export async function GET() {
  const session = await auth()
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const users = await User.find({ _id: { $ne: session.user.id } })
    .select('name image status lastSeen')
    .sort({ name: 1 })
    .lean()

  return Response.json({ users })
}

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50).trim(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
})

export async function POST(request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    await connectDB()

    const exists = await User.findOne({ email: parsed.data.email }).lean()
    if (exists) {
      return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const user = await User.create(parsed.data)

    return Response.json(
      { id: user._id.toString(), name: user.name, email: user.email },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/users:', err.message)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
