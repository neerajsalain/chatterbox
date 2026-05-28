import ChatWindow from '@/components/chat/ChatWindow'

export default async function RoomPage({ params }) {
  const { roomId } = await params
  return <ChatWindow roomId={roomId} targetType="room" />
}
