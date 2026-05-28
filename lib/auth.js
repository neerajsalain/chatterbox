import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { z } from 'zod'
import clientPromise from './mongodb-client.js'
import connectDB from './db.js'
import User from '../models/User.js'
import authConfig from './auth.config.js'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true, // Required for NextAuth v5 on non-Vercel hosts (Render, Railway, etc.)
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        await connectDB()
        const user = await User.findOne({ email: parsed.data.email }).select('+password')
        if (!user) return null

        const isValid = await user.comparePassword(parsed.data.password)
        if (!isValid) return null

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image ?? '',
        }
      },
    }),
  ],
})
