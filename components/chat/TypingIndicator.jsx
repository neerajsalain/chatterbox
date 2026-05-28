export default function TypingIndicator({ count }) {
  const label = count === 1 ? 'Someone is typing' : `${count} people are typing`

  return (
    <div className="flex items-center gap-2 px-2 py-1 mb-1">
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              background: 'var(--color-text-muted)',
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.8s',
            }}
          />
        ))}
      </div>
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
    </div>
  )
}
