export default function Avatar({ src, name, size = 36, online }) {
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const dotSize = Math.round(size * 0.28)

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-semibold text-white w-full h-full select-none"
          style={{ background: 'var(--color-primary)', fontSize: Math.round(size * 0.38) }}
        >
          {initials}
        </div>
      )}

      {online !== undefined && (
        <span
          className="absolute bottom-0 right-0 block rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            background: online ? 'var(--color-online)' : 'var(--color-offline)',
            outline: '2px solid var(--color-surface-1)',
          }}
        />
      )}
    </div>
  )
}
