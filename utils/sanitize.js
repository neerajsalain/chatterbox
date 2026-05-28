// JSX renders text content safely by default.
// This utility is for cases where content must pass through before display.

export function sanitizeText(str) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, 2000)
}

export function getFileType(mimeType) {
  if (!mimeType) return 'file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  return 'file'
}
