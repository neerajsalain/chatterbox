export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full"
         style={{ color: 'var(--color-text-muted)' }}>
      <div className="text-center">
        <div className="text-5xl mb-4">💬</div>
        <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
          Select a room to start chatting
        </p>
        <p className="text-sm mt-1">
          Pick one from the sidebar or create a new room
        </p>
      </div>
    </div>
  )
}
