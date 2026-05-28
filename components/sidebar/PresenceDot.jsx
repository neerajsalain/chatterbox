export default function PresenceDot({ status = 'offline', size = 10 }) {
  const colorMap = {
    online: 'var(--color-online)',
    away: 'var(--color-away)',
    offline: 'var(--color-offline)',
  }

  return (
    <span
      className="block rounded-full flex-shrink-0"
      style={{ width: size, height: size, background: colorMap[status] ?? colorMap.offline }}
    />
  )
}
