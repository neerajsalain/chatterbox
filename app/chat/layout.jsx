import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import ChatShell from '@/components/chat/ChatShell'

export default async function ChatLayout({ children }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return <ChatShell user={session.user}>{children}</ChatShell>
}
