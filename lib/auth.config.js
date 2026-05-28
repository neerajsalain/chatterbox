import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Edge-safe config: NO adapter, NO DB imports, NO mongodb driver
// Middleware imports only from this file — never from auth.js
const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // Authorize is a stub here — real DB check lives in auth.js
      // NextAuth requires the provider shape in both configs
      async authorize() {
        return null
      },
    }),
  ],
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = nextUrl.pathname.startsWith('/chat')
      const isAuthPage =
        nextUrl.pathname === '/login' || nextUrl.pathname === '/register'

      if (isProtected) return isLoggedIn
      // Redirect already-authed users away from login/register
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL('/chat', nextUrl))
      }
      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.image = user.image
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.image = token.image
      return session
    },
  },
}

export const { auth } = NextAuth(authConfig)
export default authConfig
