import ChatWindow from '@/components/chat/ChatWindow'

export default async function DMPage({ params }) {
  const { conversationId } = await params
  return <ChatWindow roomId={conversationId} targetType="conversation" />
}
