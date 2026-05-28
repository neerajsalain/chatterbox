export { auth as proxy } from '@/lib/auth.config'

export const config = {
  matcher: [
    '/chat/:path*',
    '/login',
    '/register',
  ],
}
