import { handlers } from '@/lib/auth'

// Never statically render — auth always depends on runtime env vars and DB
export const dynamic = 'force-dynamic'

export const { GET, POST } = handlers
