import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'

export function formatMessageTime(date) {
  const d = new Date(date)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'MMM d, HH:mm')
}

export function formatLastSeen(date) {
  if (!date) return 'a long time ago'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
